"""Fail-closed, deterministic preparation of the approved external dataset.

This command reads the immutable source named by ``dataset-source.json`` and
writes only a separately identified derivative under ``%LOCALAPPDATA%``. It
does not emit source text to the repository, and it refuses to overwrite any
previous derivative, manifest, or report.
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import re
import stat
import sys
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

try:
    from .validate_dataset import (
        CONFIGURATION,
        LABELS,
        MAX_TEXT_LENGTH,
        NON_PORTUGUESE_MARKERS,
        PII_PATTERNS,
        PORTUGUESE_MARKERS,
        SENSITIVE_PATTERNS,
        TOKEN_PATTERN,
        URL_PATTERN,
        HANDLE_PATTERN,
        expected_files,
        load_manifest,
        source_root,
        validate_source_hashes,
    )
    from .validate_gate import GateValidationError, validate_gate_document
except ImportError:  # direct execution: python scripts/prepare_dataset.py
    from validate_dataset import (  # type: ignore[no-redef]
        CONFIGURATION,
        LABELS,
        MAX_TEXT_LENGTH,
        NON_PORTUGUESE_MARKERS,
        PII_PATTERNS,
        PORTUGUESE_MARKERS,
        SENSITIVE_PATTERNS,
        TOKEN_PATTERN,
        URL_PATTERN,
        HANDLE_PATTERN,
        expected_files,
        load_manifest,
        source_root,
        validate_source_hashes,
    )
    from validate_gate import GateValidationError, validate_gate_document  # type: ignore[no-redef]


REPOSITORY = "cardiffnlp/tweet_sentiment_multilingual"
REVISION = "606156db529f327fd871515cccbe14dcbafef682"
TRANSFORMATION_VERSION = "transformation-v1"
INSTRUCTION = "Classifique o sentimento do texto em exatamente uma palavra: positivo, neutro ou negativo."
OUTPUT_RELATIVE_PATH = (
    "%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/"
    "data-derived/cardiffnlp--tweet_sentiment_multilingual/"
    f"{REVISION}/{TRANSFORMATION_VERSION}"
)
SOURCE_MANIFEST_RELATIVE_PATH = "experiments/001-resource-efficient-finetune/manifests/dataset-source.json"
GATE_ID = "G4-REMEDIATION"
EXPECTED_G4_DECISION = "DATA_BLOCKED"
SPLIT_PRIORITY = {"test": 0, "validation": 1, "train": 2}
DERIVED_SPLITS = {"train": "train", "validation": "validation", "test": "frozen-test"}
AUTHORIZED_ACTIONS = (
    "validate_g4_remediation_gate",
    "read_pinned_source_read_only",
    "verify_source_revision_and_hashes",
    "create_external_derived_dataset",
    "write_external_lineage_sidecar",
    "write_derived_dataset_info",
    "write_data_remediation_report",
)
EXPECTED_PROHIBITED_ACTIONS = (
    "mutate_source",
    "overwrite_source",
    "write_source_text_to_repository",
    "overwrite_any_existing_output",
    "change_source_revision_or_split_scope",
    "invent_or_impute_data",
    "model_loading",
    "inference",
    "baseline",
    "dry_validation",
    "training",
    "declare_original_g4_data_ready",
    "mark_t043_data_ready",
)


@dataclass
class SourceRow:
    source_split: str
    source_index: int
    text: str | None
    label: str | None
    exact_hash: str | None
    normalized_hash: str | None
    normalized_text: str | None
    language: str | None
    sensitive_categories: tuple[str, ...]
    pii_categories: tuple[str, ...]
    has_handle: bool
    has_phone: bool
    policy_reasons: list[str]
    transformed_input: str | None = None
    duplicate_reason: str | None = None
    derived_split: str | None = None
    derived_index: int | None = None


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def normalize_text(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def assess_language(text: str) -> str:
    tokens = [token.casefold() for token in TOKEN_PATTERN.findall(text)]
    if not tokens:
        return "EMPTY"
    pt = sum(token in PORTUGUESE_MARKERS for token in tokens)
    non_pt = sum(token in NON_PORTUGUESE_MARKERS for token in tokens)
    if pt >= 1 and pt >= non_pt:
        return "PT_HEURISTIC"
    if non_pt >= 2 and non_pt > pt:
        return "NON_PT_HEURISTIC"
    return "UNKNOWN_SHORT_OR_SLANG"


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def portable_external_path() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if not local_app_data:
        raise RuntimeError("LOCALAPPDATA is required for the approved external output")
    return (Path(local_app_data) / Path(OUTPUT_RELATIVE_PATH.replace("%LOCALAPPDATA%/", ""))).resolve()


def expected_scope_hash() -> str:
    basis = (
        f"{GATE_ID}|{REPOSITORY}|{REVISION}|{CONFIGURATION}|{TRANSFORMATION_VERSION}|"
        f"{OUTPUT_RELATIVE_PATH}"
    )
    return sha256_text(basis)


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as stream:
        value = json.load(stream)
    if not isinstance(value, dict):
        raise ValueError(f"expected JSON object: {path}")
    return value


def validate_g4_remediation_gate(gate: dict[str, Any], repository_root: Path, source_manifest: Path) -> None:
    validate_gate_document(
        gate,
        expected_gate_id=GATE_ID,
        required_actions=AUTHORIZED_ACTIONS,
        expected_scope_hash=expected_scope_hash(),
    )
    if gate.get("approved_at") != "2026-08-22" or gate.get("approved_by") != "experiment owner":
        raise GateValidationError("explicit owner approval dated 2026-08-22 is required")
    owner_authorization = gate.get("owner_authorization")
    if owner_authorization is not None and owner_authorization != {"approved": True}:
        raise GateValidationError("owner authorization record is inconsistent")
    required_pairs = {
        "source_manifest": SOURCE_MANIFEST_RELATIVE_PATH,
        "repository_id": REPOSITORY,
        "revision_sha": REVISION,
        "configuration": CONFIGURATION,
        "source_state_required": "APPROVED_RETRIEVED",
        "original_g4_decision": EXPECTED_G4_DECISION,
        "output_relative_path": OUTPUT_RELATIVE_PATH,
        "transformation_version": TRANSFORMATION_VERSION,
    }
    for key, expected in required_pairs.items():
        if gate.get(key) != expected:
            raise GateValidationError(f"gate field {key!r} does not match the approved scope")
    if set(gate.get("prohibited_actions", [])) < set(EXPECTED_PROHIBITED_ACTIONS):
        raise GateValidationError("gate does not record every prohibited action")
    if source_manifest.resolve() != (repository_root / SOURCE_MANIFEST_RELATIVE_PATH).resolve():
        raise GateValidationError("source manifest is outside the approved repository path")
    if gate.get("scope_hash_basis") != (
        f"{GATE_ID}|{REPOSITORY}|{REVISION}|{CONFIGURATION}|{TRANSFORMATION_VERSION}|{OUTPUT_RELATIVE_PATH}"
    ):
        raise GateValidationError("gate scope basis is stale")
    if gate.get("source_file_hashes") is None:
        raise GateValidationError("gate must pin source file hashes")


def validate_source_manifest_against_gate(manifest: dict[str, Any], gate: dict[str, Any]) -> None:
    if manifest.get("repository_id") != REPOSITORY or manifest.get("revision_sha") != REVISION:
        raise ValueError("source manifest does not identify the exact approved source")
    if manifest.get("configuration") != CONFIGURATION or manifest.get("approval_state") != "APPROVED_RETRIEVED":
        raise ValueError("source manifest is not the approved Portuguese retrieval")
    if manifest.get("transformation") != "NONE" or manifest.get("read_only") is not True:
        raise ValueError("source manifest is not unchanged and read-only")
    if manifest.get("source_text_in_repository") is not False:
        raise ValueError("source text must remain outside the repository")
    expected = sorted(gate["source_file_hashes"], key=lambda item: item["path"])
    actual = sorted(
        [{"path": item["path"], "size_bytes": int(item["size_bytes"]), "sha256": item["sha256"]} for item in manifest["file_manifest"]],
        key=lambda item: item["path"],
    )
    if actual != expected:
        raise ValueError("source file set or hashes do not match the remediation gate")


def validate_original_g4_report(path: Path) -> None:
    report = load_json(path)
    if report.get("decision") != EXPECTED_G4_DECISION:
        raise ValueError("remediation requires the recorded original G4 DATA_BLOCKED result")


def read_source_rows(root: Path, files: dict[str, dict[str, Any]]) -> tuple[list[SourceRow], dict[str, Any]]:
    rows: list[SourceRow] = []
    split_counts: dict[str, dict[str, Any]] = {}
    global_reasons: Counter[str] = Counter()
    for relative in sorted(files):
        source_split = Path(relative).stem
        path = root / Path(relative)
        records_seen = 0
        errors: Counter[str] = Counter()
        with path.open("rb") as stream:
            for source_index, raw in enumerate(stream, start=1):
                records_seen += 1
                reasons: list[str] = []
                text: str | None = None
                label: str | None = None
                exact_hash = normalized_hash = normalized_text = None
                language = None
                sensitive: tuple[str, ...] = ()
                pii: tuple[str, ...] = ()
                has_handle = has_phone = False
                try:
                    line = raw.decode("utf-8")
                    record = json.loads(line)
                except UnicodeDecodeError:
                    reasons.append("invalid_utf8")
                    errors["invalid_utf8"] += 1
                    record = None
                except json.JSONDecodeError:
                    reasons.append("malformed_json")
                    errors["malformed_json"] += 1
                    record = None
                if record is not None:
                    if not isinstance(record, dict):
                        reasons.append("record_not_object")
                        errors["record_not_object"] += 1
                    else:
                        missing = [key for key in ("text", "label") if key not in record]
                        if missing:
                            reasons.append("missing_required_field")
                            errors["missing_required_field"] += 1
                        else:
                            candidate_text = record["text"]
                            raw_label = record["label"]
                            if not isinstance(candidate_text, str):
                                reasons.append("text_not_string")
                                errors["text_not_string"] += 1
                            else:
                                text = candidate_text
                                normalized_text = normalize_text(text)
                                exact_hash = sha256_text(text)
                                normalized_hash = sha256_text(normalized_text)
                                language = assess_language(text)
                                pii = tuple(name for name, pattern in PII_PATTERNS.items() if pattern.search(text))
                                sensitive = tuple(name for name, pattern in SENSITIVE_PATTERNS.items() if pattern.search(text))
                                has_handle = bool(HANDLE_PATTERN.search(text))
                                phone_pattern = PII_PATTERNS["phone"]
                                has_phone = bool(phone_pattern.search(text))
                                if not text.strip():
                                    reasons.append("empty_text")
                                if len(text) > MAX_TEXT_LENGTH:
                                    reasons.append("over_280_unicode_chars")
                                if isinstance(raw_label, bool) or str(raw_label) not in LABELS:
                                    reasons.append("invalid_label")
                                else:
                                    label = LABELS[str(raw_label)]
                                if sensitive:
                                    reasons.append("sensitive_indicator:" + ",".join(sensitive))
                                if language == "NON_PT_HEURISTIC":
                                    reasons.append("NON_PT_HEURISTIC")
                                unredacted_pii = tuple(item for item in pii if item not in {"phone"})
                                if unredacted_pii:
                                    reasons.append("unredacted_pii_indicator:" + ",".join(unredacted_pii))
                for reason in reasons:
                    global_reasons[reason] += 1
                    if reason not in {"sensitive_indicator:" + ",".join(sensitive), "NON_PT_HEURISTIC"}:
                        errors[reason] += 1
                rows.append(
                    SourceRow(
                        source_split=source_split,
                        source_index=source_index,
                        text=text,
                        label=label,
                        exact_hash=exact_hash,
                        normalized_hash=normalized_hash,
                        normalized_text=normalized_text,
                        language=language,
                        sensitive_categories=sensitive,
                        pii_categories=pii,
                        has_handle=has_handle,
                        has_phone=has_phone,
                        policy_reasons=reasons,
                    )
                )
        split_counts[source_split] = {
            "records_seen": records_seen,
            "structural_or_policy_exclusions": sum(1 for row in rows if row.source_split == source_split and row.policy_reasons),
            "errors": dict(sorted(errors.items())),
        }
    return rows, {"records_seen": sum(item["records_seen"] for item in split_counts.values()), "splits": split_counts, "reasons": dict(sorted(global_reasons.items()))}


def transformed_input(text: str) -> tuple[str, dict[str, int]]:
    phone_pattern = PII_PATTERNS["phone"]
    phone_matches = len(phone_pattern.findall(text))
    handle_matches = len(HANDLE_PATTERN.findall(text))
    redacted = phone_pattern.sub("<TELEFONE>", text)
    redacted = HANDLE_PATTERN.sub("<USUARIO>", redacted)
    return redacted, {"phone": phone_matches, "handles": handle_matches}


def near_duplicate(left: SourceRow, right: SourceRow, *, left_text: str | None = None, right_text: str | None = None) -> bool:
    left_value = normalize_text(left_text if left_text is not None else (left.text or ""))
    right_value = normalize_text(right_text if right_text is not None else (right.text or ""))
    if left_value == right_value:
        return False
    longest = max(len(left_value), len(right_value))
    if longest < 12 or abs(len(left_value) - len(right_value)) > max(12, int(longest * 0.2)):
        return False
    return difflib.SequenceMatcher(None, left_value, right_value, autojunk=False).ratio() >= 0.92


def duplicate_pair_summary(rows: Iterable[SourceRow]) -> dict[str, Any]:
    eligible = [row for row in rows if not row.policy_reasons]
    by_split: dict[str, list[SourceRow]] = defaultdict(list)
    for row in eligible:
        by_split[row.source_split].append(row)
    pairs: dict[str, dict[str, int]] = {}
    for left_name, right_name in (("test", "train"), ("test", "validation"), ("train", "validation")):
        left_rows, right_rows = by_split.get(left_name, []), by_split.get(right_name, [])
        exact = sum(1 for left in left_rows for right in right_rows if left.exact_hash == right.exact_hash)
        normalized = sum(1 for left in left_rows for right in right_rows if left.normalized_hash == right.normalized_hash)
        near = sum(1 for left in left_rows for right in right_rows if left.normalized_hash != right.normalized_hash and near_duplicate(left, right))
        pairs[f"{left_name}__{right_name}"] = {
            "exact_text_overlap": exact,
            "normalized_text_overlap": normalized,
            "near_duplicate_pairs": near,
        }
    return {
        "pairs": pairs,
        "exact_pairs_total": sum(item["exact_text_overlap"] for item in pairs.values()),
        "normalized_pairs_total": sum(item["normalized_text_overlap"] for item in pairs.values()),
        "near_duplicate_pairs_total": sum(item["near_duplicate_pairs"] for item in pairs.values()),
    }


def resolve_duplicates(rows: list[SourceRow]) -> tuple[list[SourceRow], Counter[str]]:
    candidates = [row for row in rows if not row.policy_reasons]
    for row in candidates:
        row.transformed_input, _ = transformed_input(row.text or "")
    ordered = sorted(candidates, key=lambda row: (SPLIT_PRIORITY[row.source_split], row.source_index))
    kept: list[SourceRow] = []
    removed: Counter[str] = Counter()
    for row in ordered:
        conflicts: set[str] = set()
        for other in kept:
            if other.source_split == row.source_split:
                continue
            if row.exact_hash == other.exact_hash:
                conflicts.add("duplicate_exact")
            elif row.normalized_hash == other.normalized_hash:
                conflicts.add("duplicate_normalized")
            elif near_duplicate(row, other):
                conflicts.add("duplicate_near")
            elif normalize_text(row.transformed_input or "") == normalize_text(other.transformed_input or ""):
                conflicts.add("duplicate_redacted_normalized")
            elif near_duplicate(row, other, left_text=row.transformed_input, right_text=other.transformed_input):
                conflicts.add("duplicate_redacted_near")
        if conflicts:
            reason = ";".join(sorted(conflicts))
            row.duplicate_reason = reason
            row.policy_reasons.append(reason)
            removed[reason] += 1
        else:
            kept.append(row)
    return kept, removed


def build_derived_record(row: SourceRow) -> dict[str, str]:
    if row.transformed_input is None or row.label is None:
        raise ValueError("cannot derive a row without validated text and label")
    return {"instruction": INSTRUCTION, "input": row.transformed_input, "output": row.label}


def validate_derived_records(records: dict[str, list[dict[str, str]]]) -> dict[str, Any]:
    errors: Counter[str] = Counter()
    label_counts: dict[str, dict[str, int]] = {}
    for split, split_records in records.items():
        label_counts[split] = dict(sorted(Counter(record.get("output") for record in split_records).items()))
        for record in split_records:
            if set(record) != {"instruction", "input", "output"}:
                errors["schema_keys"] += 1
            if record.get("instruction") != INSTRUCTION:
                errors["instruction"] += 1
            if not isinstance(record.get("input"), str) or not record["input"].strip():
                errors["input"] += 1
            if record.get("output") not in set(LABELS.values()):
                errors["output"] += 1
            if HANDLE_PATTERN.search(record.get("input", "")) or PII_PATTERNS["phone"].search(record.get("input", "")):
                errors["unredacted_handle_or_phone"] += 1
    cross_split = {}
    names = sorted(records)
    for position, left_name in enumerate(names):
        for right_name in names[position + 1 :]:
            left_values = [normalize_text(item["input"]) for item in records[left_name]]
            right_values = [normalize_text(item["input"]) for item in records[right_name]]
            cross_split[f"{left_name}__{right_name}"] = {
                "exact_or_normalized_overlap": len(set(left_values) & set(right_values)),
                "near_duplicate_pairs": sum(
                    1 for left in left_values for right in right_values if left != right and len(left) >= 12 and len(right) >= 12
                    and difflib.SequenceMatcher(None, left, right, autojunk=False).ratio() >= 0.92
                ),
            }
    return {"valid": not errors and all(not any(value.values()) for value in cross_split.values()), "errors": dict(sorted(errors.items())), "class_counts": label_counts, "cross_split": cross_split}


def lineage_record(row: SourceRow) -> dict[str, Any]:
    record: dict[str, Any] = {
        "derived_split": row.derived_split,
        "derived_index": row.derived_index,
        "source_split": row.source_split,
        "source_index": row.source_index,
        "source_exact_hash": row.exact_hash,
        "source_normalized_hash": row.normalized_hash,
        "derived_record_hash": None,
        "transformation_version": TRANSFORMATION_VERSION,
        "exclusion_reason": ";".join(row.policy_reasons) if row.policy_reasons else None,
    }
    return record


def jsonl_bytes(records: Iterable[dict[str, Any]]) -> bytes:
    return b"".join(canonical_json(record) + b"\n" for record in records)


def write_external_artifacts(output_root: Path, artifacts: dict[str, bytes]) -> dict[str, dict[str, Any]]:
    output_root.mkdir(parents=True, exist_ok=True)
    temp_paths: list[Path] = []
    try:
        for name, content in artifacts.items():
            temp = output_root / f".{name}.tmp-{os.getpid()}"
            if temp.exists():
                raise FileExistsError(f"refusing to overwrite temporary output: {temp}")
            temp.write_bytes(content)
            temp_paths.append(temp)
        metadata: dict[str, dict[str, Any]] = {}
        for name, content in artifacts.items():
            target = output_root / name
            if target.exists():
                raise FileExistsError(f"refusing to overwrite existing output: {target}")
            temp = output_root / f".{name}.tmp-{os.getpid()}"
            os.link(temp, target)
            temp.unlink()
            metadata[name] = {"path": f"{OUTPUT_RELATIVE_PATH}/{name}", "size_bytes": len(content), "sha256": sha256_bytes(content)}
        return metadata
    except Exception:
        for temp in temp_paths:
            if temp.exists():
                temp.unlink()
        raise


def source_artifact_metadata(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {"path": item["path"], "size_bytes": int(item["size_bytes"]), "sha256": item["sha256"]}
        for item in sorted(manifest["file_manifest"], key=lambda item: item["path"])
    ]


def render_report(summary: dict[str, Any], info: dict[str, Any]) -> str:
    decision = summary["decision"]
    lines = [
        "# G4 remediation — derived dataset review",
        "",
        f"**Decision: `{decision}`**",
        "",
        "This is a remediation report for an existing G4 `DATA_BLOCKED` result. It does not change or replace the original G4 report, and it does not declare the original G4 result `DATA_READY`. Training remains blocked until a later review accepts this derived candidate and all subsequent gates.",
        "",
        "## Scope and authorization",
        "",
        f"- Owner approval: `2026-08-22` (`experiment owner`), gate `{GATE_ID}`.",
        f"- Source: `{REPOSITORY}` revision `{REVISION}`, configuration `{CONFIGURATION}`.",
        f"- Original G4 decision: `{EXPECTED_G4_DECISION}`.",
        f"- External output: `{OUTPUT_RELATIVE_PATH}`.",
        f"- Transformation: `{TRANSFORMATION_VERSION}`; UTF-8 JSONL Alpaca SFT.",
        "- The source was read-only and its pinned file hashes were rechecked. No source file was modified.",
        "",
        "## Transformation criteria",
        "",
        f"- Fixed instruction: `{INSTRUCTION}`.",
        "- `input` is source `text`; `output` maps `0=negativo`, `1=neutro`, `2=positivo`.",
        "- Handles are redacted as `<USUARIO>` and telephone numbers as `<TELEFONE>`.",
        "- Records with a sensitive indicator, `NON_PT_HEURISTIC`, invalid structure, empty text, over-280 text, or unredacted PII are excluded with a lineage reason.",
        "- Exact, normalized and near duplicates are resolved across splits with priority `frozen-test > validation > train`.",
        "",
        "## Counts before and after",
        "",
        f"- Source records seen: **{summary['source_records_seen']}**.",
        f"- Source counts by split: `{json.dumps(summary['source_counts_by_split'], ensure_ascii=False, sort_keys=True)}`.",
        f"- Candidate counts after policy exclusions: `{json.dumps(summary['candidate_counts_by_split'], ensure_ascii=False, sort_keys=True)}`.",
        f"- Derived counts: `{json.dumps(summary['derived_counts'], ensure_ascii=False, sort_keys=True)}`.",
        f"- Derived class counts: `{json.dumps(summary['class_counts'], ensure_ascii=False, sort_keys=True)}`.",
        f"- Exclusions by reason: `{json.dumps(summary['exclusions_by_reason'], ensure_ascii=False, sort_keys=True)}`.",
        "",
        "## Redactions",
        "",
        f"- Retained records with handle redactions: `{summary['redactions']['records_with_handles']}`; occurrences: `{summary['redactions']['handle_occurrences']}`.",
        f"- Retained records with phone redactions: `{summary['redactions']['records_with_phone']}`; occurrences: `{summary['redactions']['phone_occurrences']}`.",
        "",
        "## Duplicate resolution",
        "",
        f"- Cross-split duplicate observations before resolution: `{json.dumps(summary['duplicate_observations'], ensure_ascii=False, sort_keys=True)}`.",
        f"- Lower-priority exclusions: `{json.dumps(summary['duplicate_exclusions'], ensure_ascii=False, sort_keys=True)}`.",
        "- The frozen test output is isolated from validation and training by the recorded duplicate policy and post-transform schema check.",
        "",
        "## Validation and decision",
        "",
        f"- Derived schema validation: `{json.dumps(summary['schema_validation'], ensure_ascii=False, sort_keys=True)}`.",
        f"- Artifact metadata is recorded in `experiments/001-resource-efficient-finetune/manifests/dataset-info.json`; data and lineage remain external.",
        f"- Candidate criteria: training count 200–2,000; at least 30 examples per class in frozen-test; no post-transform cross-split exact/normalized/near duplicate; valid Alpaca schema.",
        f"- Training authorization: `BLOCKED`.",
        "",
        "## Limits",
        "",
        "- Language and sensitive-content detection are conservative heuristics; they are not semantic or legal determinations.",
        "- Redaction is limited to handles and telephone patterns authorized by this transformation; no missing data is invented.",
        "- This artifact is a derived candidate, not a replacement for owner/orchestrator review of license, privacy, schema, runtime and execution gates.",
        "- No source text, examples, or model/training artifacts are included in this repository report.",
        "",
    ]
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-manifest", type=Path)
    parser.add_argument("--gate", type=Path)
    parser.add_argument("--validation-report", type=Path)
    parser.add_argument("--dataset-info", type=Path)
    parser.add_argument("--report", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    experiment_root = Path(__file__).resolve().parents[1]
    repository_root = experiment_root.parents[1]
    source_manifest_path = (args.source_manifest or (experiment_root / "manifests" / "dataset-source.json")).resolve()
    gate_path = (args.gate or (experiment_root / "manifests" / "gates" / "g4-remediation.json")).resolve()
    validation_report_path = (args.validation_report or (experiment_root / "manifests" / "dataset-validation-g4.json")).resolve()
    dataset_info_path = (args.dataset_info or (experiment_root / "manifests" / "dataset-info.json")).resolve()
    report_path = (args.report or (experiment_root / "reports" / "data-remediation-g4.md")).resolve()
    output_root = portable_external_path()
    expected_outputs = [output_root / name for name in ("train.jsonl", "validation.jsonl", "frozen-test.jsonl", "lineage.jsonl")]
    for path in [*expected_outputs, dataset_info_path, report_path]:
        if path.exists():
            raise SystemExit(f"STOP: refusing to overwrite existing output: {path}")
    try:
        gate = load_json(gate_path)
        validate_g4_remediation_gate(gate, repository_root, source_manifest_path)
        validate_original_g4_report(validation_report_path)
        manifest = load_manifest(source_manifest_path)
        validate_source_manifest_against_gate(manifest, gate)
        source_root_path = source_root(manifest, repository_root)
        files = expected_files(manifest)
        validate_source_hashes(source_root_path, files)
        rows, read_summary = read_source_rows(source_root_path, files)
        duplicate_observations = duplicate_pair_summary(rows)
        eligible_before = [row for row in rows if not row.policy_reasons]
        kept, duplicate_exclusions = resolve_duplicates(rows)
        records: dict[str, list[dict[str, str]]] = {"train": [], "validation": [], "frozen-test": []}
        lineages: list[dict[str, Any]] = []
        redaction_counts: Counter[str] = Counter()
        for row in sorted(rows, key=lambda item: (item.source_split, item.source_index)):
            if row in kept:
                derived_split = DERIVED_SPLITS[row.source_split]
                row.derived_split = derived_split
                row.derived_index = len(records[derived_split]) + 1
                derived = build_derived_record(row)
                records[derived_split].append(derived)
                counts = transformed_input(row.text or "")[1]
                if counts["handles"]:
                    redaction_counts["records_with_handles"] += 1
                    redaction_counts["handle_occurrences"] += counts["handles"]
                if counts["phone"]:
                    redaction_counts["records_with_phone"] += 1
                    redaction_counts["phone_occurrences"] += counts["phone"]
                lineage = lineage_record(row)
                lineage["derived_record_hash"] = sha256_bytes(canonical_json(derived))
                lineages.append(lineage)
            else:
                lineages.append(lineage_record(row))
        schema_validation = validate_derived_records(records)
        derived_counts = {name: len(value) for name, value in records.items()}
        class_counts = {name: dict(sorted(Counter(item["output"] for item in value).items())) for name, value in records.items()}
        candidate_counts = dict(Counter(DERIVED_SPLITS[row.source_split] for row in eligible_before))
        exclusions = Counter(reason for row in rows if row.policy_reasons for reason in row.policy_reasons)
        summary = {
            "source_records_seen": read_summary["records_seen"],
            "source_counts_by_split": {name: value["records_seen"] for name, value in sorted(read_summary["splits"].items())},
            "candidate_counts_by_split": dict(sorted(candidate_counts.items())),
            "derived_counts": derived_counts,
            "class_counts": class_counts,
            "exclusions_by_reason": dict(sorted(exclusions.items())),
            "redactions": {
                "records_with_handles": redaction_counts["records_with_handles"],
                "handle_occurrences": redaction_counts["handle_occurrences"],
                "records_with_phone": redaction_counts["records_with_phone"],
                "phone_occurrences": redaction_counts["phone_occurrences"],
            },
            "duplicate_observations": duplicate_observations,
            "duplicate_exclusions": dict(sorted(duplicate_exclusions.items())),
            "schema_validation": schema_validation,
        }
        training_ok = 200 <= derived_counts["train"] <= 2000
        frozen_test_ok = all(class_counts["frozen-test"].get(label, 0) >= 30 for label in LABELS.values())
        candidate_ready = bool(schema_validation["valid"] and training_ok and frozen_test_ok)
        summary["decision"] = "DERIVED_CANDIDATE_READY" if candidate_ready else "DERIVED_CANDIDATE_BLOCKED"
        artifacts = {
            "train.jsonl": jsonl_bytes(records["train"]),
            "validation.jsonl": jsonl_bytes(records["validation"]),
            "frozen-test.jsonl": jsonl_bytes(records["frozen-test"]),
            "lineage.jsonl": jsonl_bytes(lineages),
        }
        artifact_metadata = write_external_artifacts(output_root, artifacts)
        info = {
            "dataset_id": f"cardiffnlp--tweet_sentiment_multilingual-{REVISION}-{TRANSFORMATION_VERSION}",
            "source": {
                "repository_id": REPOSITORY,
                "revision_sha": REVISION,
                "configuration": CONFIGURATION,
                "source_manifest": SOURCE_MANIFEST_RELATIVE_PATH,
                "source_files": source_artifact_metadata(manifest),
                "source_read_only": True,
                "original_g4_decision": EXPECTED_G4_DECISION,
            },
            "transformation_version": TRANSFORMATION_VERSION,
            "format": "UTF-8 JSONL Alpaca SFT",
            "schema": {"fields": ["instruction", "input", "output"], "instruction": INSTRUCTION, "input_source_field": "text", "output_map": LABELS},
            "redactions": {"handle": "<USUARIO>", "phone": "<TELEFONE>"},
            "split_priority": ["frozen-test", "validation", "train"],
            "artifacts": artifact_metadata,
            "counts": {"source_records_seen": read_summary["records_seen"], "derived": derived_counts, "classes": class_counts, "exclusions_by_reason": dict(sorted(exclusions.items()))},
            "decision": summary["decision"],
            "training_authorized": False,
            "paths_are_external": True,
        }
        dataset_info_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        dataset_info_path.write_bytes(canonical_json(info) + b"\n")
        report_path.write_text(render_report(summary, info), encoding="utf-8", newline="\n")
        print(json.dumps({"decision": summary["decision"], "output": OUTPUT_RELATIVE_PATH, "derived_counts": derived_counts, "dataset_info": str(dataset_info_path), "report": str(report_path)}, ensure_ascii=False))
        return 0 if candidate_ready else 2
    except (OSError, ValueError, json.JSONDecodeError, GateValidationError, RuntimeError) as exc:
        print(f"G4 REMEDIATION STOP: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
