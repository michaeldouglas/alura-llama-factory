"""Read-only G4 validation for the pinned Portuguese source dataset.

The validator reads only the external cache named by ``dataset-source.json``.
It never edits source files and writes aggregate findings only; source text is
not copied to the repository or to a derived dataset by this command.
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


REPOSITORY = "cardiffnlp/tweet_sentiment_multilingual"
REVISION = "606156db529f327fd871515cccbe14dcbafef682"
CONFIGURATION = "portuguese"
LABELS = {"0": "negativo", "1": "neutro", "2": "positivo"}
MAX_TEXT_LENGTH = 280

PORTUGUESE_MARKERS = {
    "a", "as", "ao", "aos", "com", "como", "da", "das", "de", "do", "dos",
    "e", "ela", "ele", "em", "eu", "foi", "isso", "mais", "mas", "me", "muito",
    "na", "nas", "não", "nem", "no", "nos", "nossa", "o", "os", "ou", "para",
    "pelo", "por", "pra", "que", "se", "sem", "ser", "só", "sou", "também", "tem",
    "uma", "um", "você", "vocês", "vc", "vai", "já", "sim", "não",
}
NON_PORTUGUESE_MARKERS = {
    "about", "and", "are", "been", "but", "for", "from", "have", "hello", "how",
    "i", "is", "it", "not", "please", "the", "this", "was", "what", "with", "you",
    "el", "es", "está", "hola", "los", "las", "una", "muy", "que", "por", "para",
}

PII_PATTERNS = {
    "email": re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b"),
    "phone": re.compile(r"(?<!\d)(?:\+?\d[\d ()-]{7,}\d)(?!\d)"),
    "ipv4": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
}
URL_PATTERN = re.compile(r"(?i)\b(?:https?://|www\.)\S+")
HANDLE_PATTERN = re.compile(r"(?<![\w@])@[A-Za-z0-9_]{2,30}")
TOKEN_PATTERN = re.compile(r"[\wÀ-ÿ]+", re.UNICODE)

# These are conservative indicators, not a semantic classifier. Findings are
# reported for human review and are a blocker for this first experiment.
SENSITIVE_PATTERNS = {
    "profanity": re.compile(
        r"(?i)\b(?:buceta|caralho|cu|foda|fodase|merda|puta|puto|viado|vadia)\b"
    ),
    "violence": re.compile(
        r"(?i)\b(?:matar|morte|morro|morr[ae]|assassinar|atirar|tiro|arma|bomb[ae])\b"
    ),
    "hate_or_abuse": re.compile(
        r"(?i)\b(?:racista|racismo|nazista|terrorista|estupro|estuprar|homofob)\w*\b"
    ),
    "self_harm": re.compile(
        r"(?i)\b(?:suicid|auto.?mutil|me matar|tirar minha vida)\w*\b"
    ),
}


@dataclass(frozen=True)
class Row:
    split: str
    index: int
    text: str
    label: str
    exact_hash: str
    normalized_hash: str
    normalized_text: str
    text_length: int
    language: str
    pii_categories: tuple[str, ...]
    sensitive_categories: tuple[str, ...]
    has_url: bool
    has_handle: bool


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    return " ".join(value.split())


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


def classify_content(text: str) -> tuple[tuple[str, ...], tuple[str, ...], bool, bool]:
    pii = tuple(name for name, pattern in PII_PATTERNS.items() if pattern.search(text))
    sensitive = tuple(name for name, pattern in SENSITIVE_PATTERNS.items() if pattern.search(text))
    return pii, sensitive, bool(URL_PATTERN.search(text)), bool(HANDLE_PATTERN.search(text))


def load_manifest(path: Path) -> dict:
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if manifest.get("repository_id") != REPOSITORY:
        raise ValueError("dataset manifest repository does not match the approved source")
    if manifest.get("revision_sha") != REVISION:
        raise ValueError("dataset manifest revision does not match the approved source")
    if manifest.get("configuration") != CONFIGURATION:
        raise ValueError("dataset manifest configuration does not match the approved source")
    if manifest.get("approval_state") != "APPROVED_RETRIEVED":
        raise ValueError("dataset source is not in APPROVED_RETRIEVED state")
    if manifest.get("transformation") != "NONE" or manifest.get("read_only") is not True:
        raise ValueError("dataset source is not the unchanged read-only source")
    if manifest.get("source_text_in_repository") is not False:
        raise ValueError("source text must remain outside the repository")
    return manifest


def source_root(manifest: dict, repository_root: Path) -> Path:
    root = Path(str(manifest["cache_path"])).expanduser().resolve()
    repo = repository_root.resolve()
    if root == repo or repo in root.parents:
        raise ValueError("dataset source cache must be outside the repository")
    return root


def expected_files(manifest: dict) -> dict[str, dict]:
    files = {str(item["path"]): item for item in manifest["file_manifest"]}
    expected = {"data/portuguese/test.jsonl", "data/portuguese/train.jsonl", "data/portuguese/validation.jsonl"}
    if set(files) != expected:
        raise ValueError("dataset manifest does not contain exactly the three approved Portuguese splits")
    return files


def validate_source_hashes(root: Path, files: dict[str, dict]) -> None:
    for relative, item in files.items():
        path = root / Path(relative)
        if not path.is_file():
            raise ValueError(f"approved source file is missing: {relative}")
        if not path.stat().st_mode & 0o222:
            pass
        else:
            raise ValueError(f"approved source file is writable: {relative}")
        if path.stat().st_size != int(item["size_bytes"]):
            raise ValueError(f"source size mismatch: {relative}")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != str(item["sha256"]).lower():
            raise ValueError(f"source SHA-256 mismatch: {relative}")


def read_rows(root: Path, files: dict[str, dict]) -> tuple[list[Row], dict]:
    rows: list[Row] = []
    errors: Counter[str] = Counter()
    split_stats: dict[str, dict] = {}
    for relative in sorted(files):
        split = Path(relative).stem
        path = root / Path(relative)
        split_errors: Counter[str] = Counter()
        split_rows = 0
        with path.open("rb") as handle:
            for index, raw in enumerate(handle, start=1):
                split_rows += 1
                try:
                    line = raw.decode("utf-8")
                except UnicodeDecodeError:
                    split_errors["invalid_utf8"] += 1
                    errors["invalid_utf8"] += 1
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    split_errors["malformed_json"] += 1
                    errors["malformed_json"] += 1
                    continue
                if not isinstance(record, dict):
                    split_errors["record_not_object"] += 1
                    errors["record_not_object"] += 1
                    continue
                missing = [key for key in ("text", "label") if key not in record]
                if missing:
                    split_errors["missing_required_field"] += 1
                    errors["missing_required_field"] += 1
                    continue
                text = record["text"]
                if not isinstance(text, str):
                    split_errors["text_not_string"] += 1
                    errors["text_not_string"] += 1
                    continue
                label_raw = record["label"]
                label = str(label_raw)
                if isinstance(label_raw, bool) or label not in LABELS:
                    split_errors["invalid_label"] += 1
                    errors["invalid_label"] += 1
                    continue
                if not text.strip():
                    split_errors["empty_text"] += 1
                    errors["empty_text"] += 1
                normalized = normalize_text(text)
                text_length = len(text)
                if text_length > MAX_TEXT_LENGTH:
                    split_errors["over_280_unicode_chars"] += 1
                    errors["over_280_unicode_chars"] += 1
                pii, sensitive, has_url, has_handle = classify_content(text)
                rows.append(
                    Row(
                        split=split,
                        index=index,
                        text=text,
                        label=LABELS[label],
                        exact_hash=sha256_text(text),
                        normalized_hash=sha256_text(normalized),
                        normalized_text=normalized,
                        text_length=text_length,
                        language=assess_language(text),
                        pii_categories=pii,
                        sensitive_categories=sensitive,
                        has_url=has_url,
                        has_handle=has_handle,
                    )
                )
        split_stats[split] = {
            "records_seen": split_rows,
            "valid_records": sum(row.split == split for row in rows),
            "errors": dict(sorted(split_errors.items())),
        }
    return rows, {"global_errors": dict(sorted(errors.items())), "splits": split_stats}


def overlap_counts(rows: Iterable[Row]) -> dict:
    by_split: dict[str, list[Row]] = defaultdict(list)
    for row in rows:
        by_split[row.split].append(row)
    pairs: dict[str, dict[str, int]] = {}
    near_pairs = 0
    near_examples: list[dict[str, object]] = []
    split_names = sorted(by_split)
    for left_index, left_name in enumerate(split_names):
        for right_name in split_names[left_index + 1 :]:
            left = by_split[left_name]
            right = by_split[right_name]
            exact = Counter(row.exact_hash for row in left) & Counter(row.exact_hash for row in right)
            normalized = Counter(row.normalized_hash for row in left) & Counter(row.normalized_hash for row in right)
            near = 0
            for left_row in left:
                for right_row in right:
                    if left_row.normalized_hash == right_row.normalized_hash:
                        continue
                    longest = max(len(left_row.normalized_text), len(right_row.normalized_text))
                    if longest < 12 or abs(len(left_row.normalized_text) - len(right_row.normalized_text)) > max(12, int(longest * 0.2)):
                        continue
                    ratio = difflib.SequenceMatcher(None, left_row.normalized_text, right_row.normalized_text, autojunk=False).ratio()
                    if ratio >= 0.92:
                        near += 1
                        if len(near_examples) < 20:
                            near_examples.append({"left_split": left_name, "left_index": left_row.index, "right_split": right_name, "right_index": right_row.index, "similarity": round(ratio, 4)})
            near_pairs += near
            pairs[f"{left_name}__{right_name}"] = {
                "exact_text_overlap": sum(exact.values()),
                "normalized_text_overlap": sum(normalized.values()),
                "near_duplicate_pairs": near,
            }
    return {"pairs": pairs, "near_duplicate_pairs_total": near_pairs, "near_duplicate_examples": near_examples}


def summarize(rows: list[Row], read_summary: dict, duplicate_summary: dict) -> dict:
    labels = Counter(row.label for row in rows)
    split_labels: dict[str, dict[str, int]] = {}
    lengths: dict[str, dict[str, float | int]] = {}
    language = Counter(row.language for row in rows)
    pii = Counter(category for row in rows for category in row.pii_categories)
    sensitive = Counter(category for row in rows for category in row.sensitive_categories)
    with_urls = sum(row.has_url for row in rows)
    with_handles = sum(row.has_handle for row in rows)
    for split in sorted({row.split for row in rows}):
        split_rows = [row for row in rows if row.split == split]
        split_labels[split] = dict(sorted(Counter(row.label for row in split_rows).items()))
        values = [row.text_length for row in split_rows]
        lengths[split] = {
            "min": min(values) if values else 0,
            "max": max(values) if values else 0,
            "mean": round(sum(values) / len(values), 3) if values else 0,
            "over_280": sum(value > MAX_TEXT_LENGTH for value in values),
        }
    structural_errors = sum(read_summary["global_errors"].values())
    cross_split_overlap = sum(
        value["exact_text_overlap"] + value["normalized_text_overlap"]
        for value in duplicate_summary["pairs"].values()
    )
    blockers: list[str] = []
    if structural_errors:
        blockers.append("structural_errors")
    if any(item["over_280"] for item in lengths.values()):
        blockers.append("text_over_280_unicode_chars")
    if cross_split_overlap:
        blockers.append("cross_split_exact_or_normalized_overlap")
    if duplicate_summary["near_duplicate_pairs_total"]:
        blockers.append("cross_split_near_duplicates")
    if language["NON_PT_HEURISTIC"]:
        blockers.append("non_portuguese_heuristic_records")
    if pii:
        blockers.append("direct_pii_indicators")
    if sensitive:
        blockers.append("sensitive_content_indicators")
    if not 200 <= split_labels.get("train", {}).get("negativo", 0) + split_labels.get("train", {}).get("neutro", 0) + split_labels.get("train", {}).get("positivo", 0) <= 2000:
        blockers.append("training_count_outside_200_to_2000")
    test_labels = split_labels.get("test", {})
    if any(test_labels.get(label, 0) < 30 for label in LABELS.values()):
        blockers.append("test_class_below_30_records")
    return {
        "decision": "DATA_READY" if not blockers else "DATA_BLOCKED",
        "blockers": blockers,
        "record_counts": {split: value["valid_records"] for split, value in read_summary["splits"].items()},
        "label_counts": dict(sorted(labels.items())),
        "label_mapping": LABELS,
        "split_label_counts": split_labels,
        "text_lengths_unicode_codepoints": lengths,
        "language_heuristic": {"counts": dict(sorted(language.items())), "method": "conservative token-marker heuristic; unknown short/slang text is not classified as non-Portuguese"},
        "duplicate_isolation": duplicate_summary,
        "privacy_indicators": {"direct_pii_records_by_category": dict(sorted(pii.items())), "records_with_urls": with_urls, "records_with_social_handles": with_handles, "note": "URLs and handles are reported separately; no source text is emitted."},
        "sensitive_content_indicators": {"records_by_category": dict(sorted(sensitive.items())), "method": "conservative keyword indicators requiring review; no source text is emitted."},
        "structural_validation": read_summary,
        "source_records_analyzed": len(rows),
        "source_unchanged": True,
        "derived_data_created": False,
    }


def render_report(result: dict, manifest: dict, root: Path) -> str:
    lines = [
        "# G4 — Data readiness report",
        "",
        f"**Decision: `{result['decision']}`**",
        "",
        "This report contains aggregate validation findings only. The approved source remained outside the repository, read-only, and unchanged; no derived dataset or source-text copy was created.",
        "",
        "## Source identity",
        "",
        f"- Repository: `{manifest['repository_id']}`",
        f"- Revision: `{manifest['revision_sha']}`",
        f"- Configuration: `{manifest['configuration']}`",
        f"- External cache: `{root}`",
        f"- License: `{manifest['license_id']}`; G3 terms acceptance remains the governing authorization.",
        "",
        "## Quantified findings",
        "",
        f"- Records analyzed: **{result['source_records_analyzed']}**",
        f"- Counts by split: `{json.dumps(result['record_counts'], ensure_ascii=False, sort_keys=True)}`",
        f"- Counts by label: `{json.dumps(result['label_counts'], ensure_ascii=False, sort_keys=True)}`",
        f"- Label map: `0=negativo`, `1=neutro`, `2=positivo`",
        f"- Split/class counts: `{json.dumps(result['split_label_counts'], ensure_ascii=False, sort_keys=True)}`",
        f"- Unicode length summary: `{json.dumps(result['text_lengths_unicode_codepoints'], ensure_ascii=False, sort_keys=True)}`",
        f"- Language heuristic: `{json.dumps(result['language_heuristic'], ensure_ascii=False, sort_keys=True)}`",
        f"- Duplicate isolation: `{json.dumps(result['duplicate_isolation']['pairs'], ensure_ascii=False, sort_keys=True)}`; near-duplicate pairs total `{result['duplicate_isolation']['near_duplicate_pairs_total']}`",
        f"- Privacy indicators: `{json.dumps(result['privacy_indicators'], ensure_ascii=False, sort_keys=True)}`",
        f"- Sensitive-content indicators: `{json.dumps(result['sensitive_content_indicators'], ensure_ascii=False, sort_keys=True)}`",
        "",
        "## Decision basis",
        "",
    ]
    if result["blockers"]:
        lines.append("The dataset is blocked for the following quantified or policy reasons:")
        lines.extend(f"- `{item}`" for item in result["blockers"])
    else:
        lines.append("No blocking condition was found by the defined structural, split-isolation, scope, privacy-indicator, and sensitive-content checks.")
    lines.extend(
        [
            "",
            "`DATA_READY` here means the immutable source passed G4 validation. It does not authorize preparation, conversion, filtering, model loading, inference, or training. Those remain separate gated steps; any derived record must preserve source lineage and be written outside the repository.",
            "",
            "## Reproducibility and limitations",
            "",
            "- Validation rechecked the approved SHA-256 hashes before reading JSONL records.",
            "- Text length is measured as Unicode code points, with the specification limit of 280.",
            "- Language and sensitive-content checks are conservative heuristics and do not replace human review when a finding is present.",
            "- No raw text, examples, or row-level identifiers are included in this report.",
            "",
        ]
    )
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-manifest", type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--machine-report", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    experiment_root = Path(__file__).resolve().parents[1]
    repository_root = experiment_root.parents[1]
    manifest_path = args.source_manifest or (experiment_root / "manifests" / "dataset-source.json")
    report_path = args.report or (experiment_root / "reports" / "data-readiness-g4.md")
    machine_report_path = args.machine_report or (experiment_root / "manifests" / "dataset-validation-g4.json")
    try:
        manifest = load_manifest(manifest_path.resolve())
        root = source_root(manifest, repository_root)
        files = expected_files(manifest)
        validate_source_hashes(root, files)
        rows, read_summary = read_rows(root, files)
        duplicate_summary = overlap_counts(rows)
        result = summarize(rows, read_summary, duplicate_summary)
        report = render_report(result, manifest, root)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        machine_report_path.parent.mkdir(parents=True, exist_ok=True)
        if report_path.exists() or machine_report_path.exists():
            raise ValueError("refusing to overwrite an existing G4 report")
        report_path.write_text(report, encoding="utf-8", newline="\n")
        machine = {
            "report_type": "G4_DATA_READINESS",
            "source_manifest": str(manifest_path.resolve()),
            "source_revision": REVISION,
            "decision": result["decision"],
            "result": result,
            "derived_data_created": False,
        }
        machine_report_path.write_text(json.dumps(machine, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
        print(json.dumps({"decision": result["decision"], "report": str(report_path), "machine_report": str(machine_report_path), "records": result["source_records_analyzed"]}, ensure_ascii=False))
        return 0 if result["decision"] == "DATA_READY" else 2
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"G4 STOP: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
