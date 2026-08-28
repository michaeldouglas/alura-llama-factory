"""Read-only preflight for using the existing EscutIA artifacts from the harness.

This module deliberately does not import or execute scripts from EscutIA. It only
reads the prepared artifacts, their reports, and the existing LoRA configuration.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


HARNESS_ROOT = Path(__file__).resolve().parents[3]
PROFILE_PATH = HARNESS_ROOT / "integrations" / "escutia" / "escutia-integration.json"
LABELS = {"negativo", "neutro", "positivo"}


class IntegrationError(ValueError):
    """Raised when the external project does not satisfy the integration contract."""


def load_profile() -> dict[str, Any]:
    with PROFILE_PATH.open(encoding="utf-8") as handle:
        profile = json.load(handle)
    if profile.get("project_name") != "EscutIA":
        raise IntegrationError("The integration profile must target EscutIA.")
    if profile.get("read_only_target") is not True:
        raise IntegrationError("The EscutIA target must be marked read-only.")
    return profile


def resolve_project_root(argument: str | None, profile: dict[str, Any]) -> Path:
    candidate = (
        Path(argument).expanduser()
        if argument
        else HARNESS_ROOT / profile["project_root_default"]
    ).resolve()
    if candidate.name.casefold() == "escutai":
        raise IntegrationError("EscutAI is not the target; the existing project is EscutIA.")
    if candidate.name.casefold() != "escutia":
        raise IntegrationError(f"Refusing project root '{candidate.name}'; expected EscutIA.")
    if not candidate.is_dir():
        raise IntegrationError(f"EscutIA project root does not exist: {candidate}")
    return candidate


def read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_output(value: Any, labels: set[str]) -> str:
    if not isinstance(value, str):
        raise IntegrationError("Dataset output must be a JSON string.")
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        raise IntegrationError(f"Dataset output is not valid JSON: {exc.msg}") from exc
    if not isinstance(parsed, dict) or set(parsed) != {"sentimento"} or parsed["sentimento"] not in labels:
        raise IntegrationError("Dataset output must contain exactly one supported sentimento label.")
    return parsed["sentimento"]


def validate_records(path: Path, labels: set[str]) -> dict[str, Any]:
    records = read_json(path)
    if not isinstance(records, list) or not records:
        raise IntegrationError(f"{path.name} must be a non-empty JSON array.")
    counts: Counter[str] = Counter()
    for index, record in enumerate(records):
        if not isinstance(record, dict):
            raise IntegrationError(f"{path.name}[{index}] must be an object.")
        required = {"instruction", "input", "output"}
        if not required.issubset(record):
            raise IntegrationError(f"{path.name}[{index}] is missing a required field.")
        if not isinstance(record["instruction"], str) or not record["instruction"].strip():
            raise IntegrationError(f"{path.name}[{index}].instruction must be non-empty text.")
        if not isinstance(record["input"], str) or not record["input"].strip():
            raise IntegrationError(f"{path.name}[{index}].input must be non-empty text.")
        counts[parse_output(record["output"], labels)] += 1
    return {"records": len(records), "labels": dict(sorted(counts.items()))}


def validate_conversational(path: Path, labels: set[str]) -> int:
    records = read_json(path)
    if not isinstance(records, list) or not records:
        raise IntegrationError(f"{path.name} must be a non-empty JSON array.")
    for index, record in enumerate(records):
        messages = record.get("messages") if isinstance(record, dict) else None
        if not isinstance(messages, list) or not messages:
            raise IntegrationError(f"{path.name}[{index}].messages must be a non-empty array.")
        assistant = [item for item in messages if item.get("role") == "assistant"]
        if len(assistant) != 1:
            raise IntegrationError(f"{path.name}[{index}] must contain one assistant message.")
        parse_output(assistant[0].get("content"), labels)
    return len(records)


def parse_yaml_scalars(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    pattern = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*):\s*(.*?)\s*$")
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            match = pattern.match(line)
            if not match or match.group(1).startswith("#"):
                continue
            value = match.group(2).split(" #", 1)[0].strip()
            values[match.group(1)] = value.strip("'\"")
    return values


def validate_model_config(path: Path, profile: dict[str, Any]) -> dict[str, Any]:
    values = parse_yaml_scalars(path)
    expected = {
        "model_name_or_path": profile["model"]["name_or_path"],
        "model_revision": profile["model"]["revision"],
        "dataset": profile["dataset"]["train_name"],
        "eval_dataset": profile["dataset"]["validation_name"],
        "stage": profile["llama_factory"]["stage"],
        "finetuning_type": profile["llama_factory"]["finetuning_type"],
        "template": profile["llama_factory"]["template"],
    }
    mismatches = {key: {"expected": value, "actual": values.get(key)} for key, value in expected.items() if values.get(key) != value}
    if mismatches:
        raise IntegrationError(f"EscutIA LoRA config does not match the integration profile: {mismatches}")
    return {"path": str(path), "checked_keys": sorted(expected)}


def validate(profile: dict[str, Any], project_root: Path) -> dict[str, Any]:
    paths = {name: project_root / relative for name, relative in profile["source_paths"].items()}
    directory_keys = {"dataset_dir"}
    missing = [
        name
        for name, path in paths.items()
        if not (path.is_dir() if name in directory_keys else path.is_file())
    ]
    if missing:
        raise IntegrationError(f"Required EscutIA artifacts are missing: {', '.join(missing)}")

    dataset = profile["dataset"]
    split_results = {
        name: validate_records(paths[name], set(dataset["labels"]))
        for name in ("train", "validation", "evaluation")
    }
    conversational_counts = {
        name: validate_conversational(paths[name], set(dataset["labels"]))
        for name in ("train_conversational", "validation_conversational", "evaluation_conversational")
    }

    info = read_json(paths["dataset_info"])
    expected_names = {dataset["train_name"], dataset["validation_name"], dataset["evaluation_name"]}
    if not expected_names.issubset(info):
        raise IntegrationError("dataset_info.json does not declare all required EscutIA datasets.")

    validation_report = read_json(paths["validation_report"])
    if validation_report.get("decisao") != "DATA_READY_FOR_SFT":
        raise IntegrationError("EscutIA validation report is not DATA_READY_FOR_SFT.")
    failed_checks = [item for item in validation_report.get("resultados", []) if item.get("status") != "PASS"]
    if failed_checks:
        raise IntegrationError(f"EscutIA validation report contains failed checks: {failed_checks}")

    leakage = read_json(paths["leakage_report"])
    if leakage.get("status") != "PASS" or any(leakage.get("sobreposicoes", {}).values()):
        raise IntegrationError("EscutIA leakage report is not a clean PASS.")

    frozen_report = read_json(paths["frozen_report"])
    if frozen_report.get("registros") != split_results["evaluation"]["records"]:
        raise IntegrationError("Frozen evaluation count does not match the evaluation split.")
    if frozen_report.get("sha256") != sha256(paths["frozen_evaluation"]):
        raise IntegrationError("Frozen evaluation hash does not match its report.")

    manifesto = read_json(paths["dataset_manifest"])
    source_hashes = manifesto.get("source_sha256", {})
    source_integrity = {
        name: {"expected": expected, "actual": sha256(project_root / "dataset" / "dados" / name)}
        for name, expected in source_hashes.items()
    }
    if any(item["expected"] != item["actual"] for item in source_integrity.values()):
        raise IntegrationError("EscutIA source hashes differ from manifesto_dataset.json.")

    config_result = validate_model_config(paths["model_config"], profile)
    return {
        "status": "READY",
        "integration_id": profile["integration_id"],
        "project_name": profile["project_name"],
        "project_root": str(project_root),
        "read_only_target": True,
        "dataset": {"splits": split_results, "conversational_records": conversational_counts},
        "reports": {
            "validation_decision": validation_report["decisao"],
            "leakage_status": leakage["status"],
            "frozen_evaluation_sha256": frozen_report["sha256"],
        },
        "source_integrity": source_integrity,
        "model_config": config_result,
        "execution": {
            "training_started": False,
            "repository_writes": False,
            "escutia_writes": False,
            "external_output_only": True,
            "explicit_authorization_required": True,
            "training_authorized_by_preflight": False,
        },
        "notes": [
            "EscutIA is consumed as an existing read-only project; its preparation scripts are not invoked.",
            "The target manifesto's training_authorized field is not treated as harness execution authorization.",
        ],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-root", help="Existing EscutIA directory; defaults to ../EscutIA")
    args = parser.parse_args(argv)
    try:
        profile = load_profile()
        project_root = resolve_project_root(args.project_root, profile)
        result = validate(profile, project_root)
    except (OSError, IntegrationError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "BLOCKED", "error": str(exc)}, ensure_ascii=False, indent=2))
        return 2
    result["checked_at_utc"] = datetime.now(timezone.utc).isoformat()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
