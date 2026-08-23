"""Fail-closed, metadata-only compatibility validation for T049/T050.

This script deliberately does not load model weights and does not call any
training, inference, forward, backward, optimizer, or checkpoint API. It
reads the approved external artifacts, validates their identities and hashes,
and records one aggregate G5 compatibility decision in the repository.
"""

from __future__ import annotations

import hashlib
import json
import os
import platform
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Callable


EXPERIMENT_ID = "001-resource-efficient-finetune"
MODEL_REPOSITORY = "Qwen/Qwen2.5-0.5B-Instruct"
MODEL_REVISION = "7ae557604adf67be50417f59c2c2f167def9a775"
DATASET_REPOSITORY = "cardiffnlp/tweet_sentiment_multilingual"
DATASET_REVISION = "606156db529f327fd871515cccbe14dcbafef682"
TRANSFORMATION_VERSION = "transformation-v1"
INSTRUCTION = "Classifique o sentimento do texto em exatamente uma palavra: positivo, neutro ou negativo."
LABELS = {"negativo", "neutro", "positivo"}
EXPECTED_TEMPLATE = "qwen"
EXPECTED_LLAMAFACTORY = "0.9.5"
EXPECTED_TORCH_PREFIX = "2.9.1+xpu"
REPORT_RELATIVE = Path("experiments/001-resource-efficient-finetune/reports/compatibility-g5.json")
CONFIG_RELATIVE = Path("experiments/001-resource-efficient-finetune/configs/sft-lora-proposal.yaml")
MODEL_MANIFEST_RELATIVE = Path("experiments/001-resource-efficient-finetune/manifests/model-source.json")
DATASET_MANIFEST_RELATIVE = Path("experiments/001-resource-efficient-finetune/manifests/dataset-info.json")
G4_RELATIVE = Path("experiments/001-resource-efficient-finetune/manifests/gates/g4-derived.json")


class ValidationState:
    def __init__(self) -> None:
        self.checks: list[dict[str, Any]] = []
        self.errors: list[str] = []
        self.runtime: dict[str, Any] = {}
        self.evidence: dict[str, Any] = {}

    def add(self, name: str, passed: bool, details: Any, *, blocking: bool = True) -> None:
        status = "PASS" if passed else "BLOCKED"
        self.checks.append({"name": name, "status": status, "details": details})
        if not passed and blocking:
            self.errors.append(f"{name}: {details}")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sha256_json(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as stream:
        return json.load(stream)


def resolved_external_root() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if not local_app_data:
        raise RuntimeError("LOCALAPPDATA is unavailable; no fallback path is allowed")
    return (Path(local_app_data) / "alura-llama-factory" / EXPERIMENT_ID).resolve()


def is_within(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def path_is_external(path: Path, root: Path, repo: Path) -> bool:
    return path.is_absolute() and not is_within(path, repo) and is_within(path, root)


def check_file_hash(path: Path, expected: dict[str, Any]) -> dict[str, Any]:
    if not path.is_file():
        return {"path": str(path), "status": "MISSING"}
    actual_size = path.stat().st_size
    actual_hash = sha256_file(path)
    return {
        "path": str(path),
        "status": "PASS" if actual_size == int(expected["size_bytes"]) and actual_hash == expected["sha256"] else "MISMATCH",
        "expected_size_bytes": int(expected["size_bytes"]),
        "actual_size_bytes": actual_size,
        "expected_sha256": str(expected["sha256"]).lower(),
        "actual_sha256": actual_hash,
    }


def validate_model(state: ValidationState, root: Path, external_root: Path) -> Path | None:
    manifest_path = root / MODEL_MANIFEST_RELATIVE
    try:
        manifest = load_json(manifest_path)
        cache_path = Path(manifest["cache_path"]).resolve()
        manifest_identity = (
            manifest.get("repository_id") == MODEL_REPOSITORY
            and manifest.get("revision_sha") == MODEL_REVISION
            and manifest.get("approval_state") == "APPROVED_RETRIEVED"
            and manifest.get("model_retrieved") is True
        )
        state.add("model_manifest_identity", manifest_identity, {
            "repository_id": manifest.get("repository_id"),
            "revision_sha": manifest.get("revision_sha"),
            "approval_state": manifest.get("approval_state"),
        })
        state.add("model_cache_external", path_is_external(cache_path, external_root, root), str(cache_path))
        files = manifest.get("file_manifest", [])
        file_results = [check_file_hash(cache_path / item["path"], item) for item in files]
        hashes_pass = (
            len(files) == int(manifest.get("file_count", -1))
            and all(result["status"] == "PASS" for result in file_results)
            and sum(int(item["size_bytes"]) for item in files) == int(manifest.get("retrieved_bytes", -1))
        )
        state.add("model_revision_file_hashes", hashes_pass, {
            "file_count": len(files),
            "expected_file_count": manifest.get("file_count"),
            "files": file_results,
            "weights_read_for_hash_only": any(item.get("path") == "model.safetensors" for item in files),
        })
        state.evidence["model"] = {
            "repository_id": manifest.get("repository_id"),
            "revision_sha": manifest.get("revision_sha"),
            "cache_path": str(cache_path),
            "parameter_count": manifest.get("parameter_count"),
            "file_hashes": file_results,
        }
        return cache_path
    except Exception as exc:
        state.add("model_manifest_identity", False, repr(exc))
        return None


def validate_dataset(state: ValidationState, root: Path, external_root: Path) -> Path | None:
    try:
        manifest = load_json(root / DATASET_MANIFEST_RELATIVE)
        g4 = load_json(root / G4_RELATIVE)
        dataset_dir = external_root / "data-derived" / "cardiffnlp--tweet_sentiment_multilingual" / DATASET_REVISION / TRANSFORMATION_VERSION
        gate_pass = (
            g4.get("gate_id") == "G4-DERIVED"
            and g4.get("decision") == "DATA_READY"
            and g4.get("dataset_id") == manifest.get("dataset_id")
            and g4.get("transformation_version") == TRANSFORMATION_VERSION
            and g4.get("training_authorized") is False
        )
        state.add("g4_derived_data_ready", gate_pass, {
            "gate_id": g4.get("gate_id"),
            "decision": g4.get("decision"),
            "dataset_id": g4.get("dataset_id"),
            "training_authorized": g4.get("training_authorized"),
        })
        identity_pass = (
            manifest.get("dataset_id") == f"cardiffnlp--tweet_sentiment_multilingual-{DATASET_REVISION}-{TRANSFORMATION_VERSION}"
            and manifest.get("decision") == "DERIVED_CANDIDATE_READY"
            and manifest.get("transformation_version") == TRANSFORMATION_VERSION
            and manifest.get("source", {}).get("repository_id") == DATASET_REPOSITORY
            and manifest.get("source", {}).get("revision_sha") == DATASET_REVISION
            and manifest.get("schema", {}).get("fields") == ["instruction", "input", "output"]
        )
        state.add("dataset_manifest_identity", identity_pass, {
            "dataset_id": manifest.get("dataset_id"),
            "source_revision_sha": manifest.get("source", {}).get("revision_sha"),
            "transformation_version": manifest.get("transformation_version"),
            "paths_are_external": manifest.get("paths_are_external"),
        })
        state.add("dataset_directory_external", path_is_external(dataset_dir, external_root, root), str(dataset_dir))

        artifacts = manifest.get("artifacts", {})
        expected_counts = manifest.get("counts", {}).get("classes", {})
        split_files = {"train": "train.jsonl", "validation": "validation.jsonl", "frozen-test": "frozen-test.jsonl"}
        records: dict[str, list[dict[str, Any]]] = {}
        artifact_results: dict[str, Any] = {}
        jsonl_pass = True
        for split, filename in split_files.items():
            path = dataset_dir / filename
            expected = artifacts.get(filename, {})
            result = check_file_hash(path, expected)
            rows: list[dict[str, Any]] = []
            parse_errors: list[str] = []
            if path.is_file():
                try:
                    with path.open("r", encoding="utf-8", newline="") as stream:
                        for line_number, line in enumerate(stream, 1):
                            if not line.strip():
                                parse_errors.append(f"blank line {line_number}")
                                continue
                            try:
                                row = json.loads(line)
                                if not isinstance(row, dict):
                                    raise ValueError("record is not an object")
                                if set(row) != {"instruction", "input", "output"}:
                                    raise ValueError(f"fields are {sorted(row)}")
                                if not all(isinstance(row[field], str) for field in ("instruction", "input", "output")):
                                    raise ValueError("all Alpaca fields must be strings")
                                if row["instruction"] != INSTRUCTION:
                                    raise ValueError("instruction differs from the frozen instruction")
                                if row["output"] not in LABELS:
                                    raise ValueError(f"invalid label {row['output']!r}")
                                rows.append(row)
                            except Exception as exc:
                                parse_errors.append(f"line {line_number}: {exc}")
                except Exception as exc:
                    parse_errors.append(repr(exc))
            counts = Counter(row["output"] for row in rows)
            expected_class_counts = expected_counts.get(split, {})
            result["record_count"] = len(rows)
            result["class_counts"] = dict(sorted(counts.items()))
            result["expected_class_counts"] = expected_class_counts
            result["parse_errors"] = parse_errors
            result["schema"] = "PASS" if not parse_errors and dict(sorted(counts.items())) == dict(sorted(expected_class_counts.items())) else "MISMATCH"
            artifact_results[filename] = result
            records[split] = rows
            jsonl_pass = jsonl_pass and result["status"] == "PASS" and result["schema"] == "PASS"
        state.add("external_jsonl_schema_counts_hashes", jsonl_pass, artifact_results)

        lineage_path = dataset_dir / "lineage.jsonl"
        lineage_expected = artifacts.get("lineage.jsonl", {})
        lineage_result = check_file_hash(lineage_path, lineage_expected)
        lineage_rows: list[dict[str, Any]] = []
        lineage_errors: list[str] = []
        if lineage_path.is_file():
            with lineage_path.open("r", encoding="utf-8") as stream:
                for line_number, line in enumerate(stream, 1):
                    try:
                        row = json.loads(line)
                        if not isinstance(row, dict):
                            raise ValueError("lineage record is not an object")
                        required = {"derived_index", "derived_record_hash", "derived_split", "source_exact_hash", "source_index", "source_normalized_hash", "source_split", "transformation_version"}
                        if not required.issubset(row):
                            raise ValueError("lineage fields are incomplete")
                        if row["transformation_version"] != TRANSFORMATION_VERSION:
                            raise ValueError("lineage transformation version mismatch")
                        lineage_rows.append(row)
                    except Exception as exc:
                        lineage_errors.append(f"line {line_number}: {exc}")
        lineage_split_counts = Counter(row.get("derived_split") for row in lineage_rows)
        retained_lineage = [row for row in lineage_rows if row.get("derived_split") is not None]
        retained_split_counts = Counter(row.get("derived_split") for row in retained_lineage)
        lineage_identity = (
            lineage_result["status"] == "PASS"
            and not lineage_errors
            and len(lineage_rows) == int(manifest.get("counts", {}).get("source_records_seen", -1))
            and dict(retained_split_counts) == {"train": 1792, "validation": 314, "frozen-test": 854}
            and len({(row.get("derived_split"), row.get("derived_index")) for row in retained_lineage}) == len(retained_lineage)
        )
        lineage_result.update({"record_count": len(lineage_rows), "split_counts": dict(lineage_split_counts), "retained_split_counts": dict(retained_split_counts), "excluded_rows": sum(row.get("derived_split") is None for row in lineage_rows), "parse_errors": lineage_errors})
        state.add("lineage_hashes_and_completeness", lineage_identity, lineage_result)
        state.evidence["dataset"] = {
            "dataset_info_manifest": str(root / DATASET_MANIFEST_RELATIVE),
            "external_dataset_dir": str(dataset_dir),
            "artifacts": artifact_results,
            "lineage": lineage_result,
        }
        return dataset_dir
    except Exception as exc:
        state.add("dataset_manifest_identity", False, repr(exc))
        return None


def validate_config_and_llamafactory(
    state: ValidationState,
    root: Path,
    external_root: Path,
    model_path: Path | None,
    dataset_dir: Path | None,
) -> dict[str, Any]:
    config_path = root / CONFIG_RELATIVE
    try:
        from omegaconf import OmegaConf

        config = OmegaConf.to_container(OmegaConf.load(config_path), resolve=True)
        if not isinstance(config, dict):
            raise TypeError("proposal YAML did not produce a mapping")
        state.evidence["config_yaml"] = {"path": str(config_path), "sha256": sha256_file(config_path), "keys": sorted(config)}
        state.add("config_yaml_parse", True, {"path": str(config_path), "sha256": sha256_file(config_path)})
    except Exception as exc:
        state.add("config_yaml_parse", False, repr(exc))
        return {}

    path_values = {key: config.get(key) for key in ("model_name_or_path", "cache_dir", "dataset_dir", "output_dir", "logging_dir")}
    paths_pass = True
    path_details: dict[str, Any] = {}
    repo = root.resolve()
    for key, value in path_values.items():
        if not isinstance(value, str):
            paths_pass = False
            path_details[key] = {"status": "MISSING_OR_NOT_STRING", "value": value}
            continue
        candidate = Path(value).resolve()
        is_ext = path_is_external(candidate, external_root, repo)
        exists = candidate.exists()
        no_overwrite = key not in {"output_dir", "logging_dir"} or not exists
        path_details[key] = {"path": str(candidate), "external": is_ext, "exists": exists, "no_overwrite": no_overwrite}
        paths_pass = paths_pass and is_ext and no_overwrite
    state.add("config_paths_external_and_no_overwrite", paths_pass, path_details)
    state.add("config_matches_approved_inputs", (
        model_path is not None
        and dataset_dir is not None
        and Path(config.get("model_name_or_path", "")).resolve() == model_path
        and Path(config.get("dataset_dir", "")).resolve() == dataset_dir
        and config.get("model_revision") == MODEL_REVISION
        and config.get("template") == EXPECTED_TEMPLATE
        and config.get("stage") == "sft"
        and config.get("finetuning_type") == "lora"
    ), {
        "model_revision": config.get("model_revision"),
        "template": config.get("template"),
        "stage": config.get("stage"),
        "finetuning_type": config.get("finetuning_type"),
    })

    # LLaMA-Factory's own argument parser is used for the YAML, without
    # entering its launcher or model loader.
    try:
        from llamafactory.hparams import get_train_args

        parsed = get_train_args(config)
        model_args, data_args, training_args, finetuning_args, generating_args = parsed
        state.add("llamafactory_config_parser", True, {
            "model_name_or_path": model_args.model_name_or_path,
            "dataset_dir": data_args.dataset_dir,
            "dataset": data_args.dataset,
            "eval_dataset": data_args.eval_dataset,
            "template": data_args.template,
            "do_train": training_args.do_train,
            "do_eval": training_args.do_eval,
            "finetuning_type": finetuning_args.finetuning_type,
        })
        state.evidence["llamafactory_args"] = {"parsed": True}
    except Exception as exc:
        state.add("llamafactory_config_parser", False, repr(exc))
        parsed = None

    # The canonical registry is intentionally required at the external
    # dataset location. We never synthesize or write it here.
    registry_path = (dataset_dir / "dataset_info.json") if dataset_dir else None
    registry_pass = registry_path is not None and registry_path.is_file()
    registry_details: dict[str, Any] = {"path": str(registry_path) if registry_path else None, "exists": registry_pass}
    if registry_pass:
        try:
            registry = load_json(registry_path)  # type: ignore[arg-type]
            from llamafactory.data.parser import get_dataset_list

            attrs = get_dataset_list(["train", "validation"], str(dataset_dir))
            registry_details["keys"] = sorted(registry)
            registry_details["attributes"] = [
                {"name": attr.dataset_name, "formatting": attr.formatting, "file": attr.dataset_name}
                for attr in attrs
            ]
            registry_pass = all(attr.formatting == "alpaca" for attr in attrs)
        except Exception as exc:
            registry_pass = False
            registry_details["error"] = repr(exc)
    else:
        registry_details["reason"] = "LLaMA-Factory requires dataset_info.json for named local datasets; it was not created by this validator."
    state.add("llamafactory_dataset_info_registration", registry_pass, registry_details)

    # Exercise the installed Alpaca converter against a record, even when the
    # registry check is blocked, without loading the dataset through HF or
    # starting a data loader.
    converter_pass = False
    converter_details: dict[str, Any] = {}
    try:
        from llamafactory.data.converter import get_dataset_converter
        from llamafactory.data.parser import DatasetAttr

        if parsed is None or dataset_dir is None:
            raise RuntimeError("parsed LLaMA-Factory arguments or dataset directory unavailable")
        _, data_args, _, _, _ = parsed
        sample_path = dataset_dir / "train.jsonl"
        with sample_path.open("r", encoding="utf-8") as stream:
            sample = json.loads(stream.readline())
        attr = DatasetAttr("file", "train.jsonl", formatting="alpaca")
        converted = get_dataset_converter("alpaca", attr, data_args)(sample)
        converter_pass = (
            converted["_prompt"][0]["role"] == "user"
            and converted["_prompt"][0]["content"] == INSTRUCTION + "\n" + sample["input"]
            and converted["_response"][0]["content"] == sample["output"]
        )
        converter_details = {"formatting": attr.formatting, "converted_prompt_role": converted["_prompt"][0]["role"]}
    except Exception as exc:
        converter_details = {"error": repr(exc)}
    state.add("llamafactory_alpaca_converter", converter_pass, converter_details)
    return config


def validate_model_files_without_weights(state: ValidationState, model_path: Path | None) -> None:
    if model_path is None:
        state.add("config_and_tokenizer_identity", False, "model path unavailable")
        return
    try:
        config_data = load_json(model_path / "config.json")
        os.environ["HF_HUB_OFFLINE"] = "1"
        os.environ["TRANSFORMERS_OFFLINE"] = "1"
        os.environ["TOKENIZERS_PARALLELISM"] = "false"
        from transformers import AutoConfig, AutoTokenizer

        # These are metadata/tokenizer loads only. No AutoModel class is
        # imported or called, and model.safetensors is never deserialized.
        config = AutoConfig.from_pretrained(str(model_path), local_files_only=True, trust_remote_code=False)
        tokenizer = AutoTokenizer.from_pretrained(str(model_path), local_files_only=True, trust_remote_code=False, use_fast=True)
        details = {
            "config_json_model_type": config_data.get("model_type"),
            "loaded_config_model_type": getattr(config, "model_type", None),
            "tokenizer_class": tokenizer.__class__.__name__,
            "tokenizer_vocab_size": getattr(tokenizer, "vocab_size", None),
            "config_vocab_size": getattr(config, "vocab_size", None),
            "special_tokens": tokenizer.special_tokens_map,
            "config_loaded_without_weights": True,
            "tokenizer_loaded_from_local_files": True,
        }
        vocab_padding = int(details["config_vocab_size"]) - int(details["tokenizer_vocab_size"])
        passed = (
            details["config_json_model_type"] == details["loaded_config_model_type"] == "qwen2"
            and 0 <= vocab_padding <= 4096
        )
        details["config_vocab_padding"] = vocab_padding
        state.add("config_and_tokenizer_identity", passed, details)
        state.evidence["model_metadata_loads"] = {
            "config_loaded": True,
            "tokenizer_loaded": True,
            "weights_loaded": False,
            "details": details,
        }
    except Exception as exc:
        state.add("config_and_tokenizer_identity", False, {"error": repr(exc), "weights_loaded": False})


def validate_template(state: ValidationState, parsed_config: dict[str, Any]) -> None:
    try:
        model_path = Path(parsed_config["model_name_or_path"])
        from transformers import AutoTokenizer
        from llamafactory.data.template import get_template_and_fix_tokenizer
        from llamafactory.hparams import get_train_args

        tokenizer = AutoTokenizer.from_pretrained(str(model_path), local_files_only=True, trust_remote_code=False, use_fast=True)
        _, data_args, _, _, _ = get_train_args(parsed_config)
        template = get_template_and_fix_tokenizer(tokenizer, data_args)
        details = {
            "requested": parsed_config.get("template"),
            "resolved_class": template.__class__.__name__,
            "stop_words": list(template.stop_words),
            "tokenizer_mutated_in_memory_only": True,
        }
        state.add("llamafactory_qwen_template", parsed_config.get("template") == EXPECTED_TEMPLATE and bool(template), details)
    except Exception as exc:
        state.add("llamafactory_qwen_template", False, repr(exc))


def validate_runtime(state: ValidationState, external_root: Path, repo: Path) -> None:
    environment_root = external_root / "environments" / "py312-xpu"
    expected_python = environment_root / "Scripts" / "python.exe"
    runtime_details: dict[str, Any] = {
        "expected_environment": str(environment_root),
        "actual_python": sys.executable,
        "environment_outside_repository": not is_within(environment_root, repo),
        "python_version": platform.python_version(),
        "architecture": platform.architecture()[0],
    }
    try:
        import torch
        import llamafactory

        runtime_details.update({
            "torch": torch.__version__,
            "llamafactory": getattr(llamafactory, "__version__", None),
            "xpu_available": bool(torch.xpu.is_available()),
            "xpu_device_count": int(torch.xpu.device_count()) if torch.xpu.is_available() else 0,
        })
        runtime_pass = (
            Path(sys.executable).resolve() == expected_python.resolve()
            and runtime_details["environment_outside_repository"]
            and runtime_details["python_version"] == "3.12.12"
            and runtime_details["architecture"] == "64bit"
            and str(runtime_details["torch"]).startswith(EXPECTED_TORCH_PREFIX)
            and runtime_details["llamafactory"] == EXPECTED_LLAMAFACTORY
            and runtime_details["xpu_available"] is True
            and runtime_details["xpu_device_count"] == 1
        )
        state.add("python_torch_llamafactory_xpu_runtime", runtime_pass, runtime_details)
    except Exception as exc:
        runtime_details["error"] = repr(exc)
        state.add("python_torch_llamafactory_xpu_runtime", False, runtime_details)
    state.runtime = runtime_details


def write_report(state: ValidationState, root: Path) -> Path:
    report_path = root / REPORT_RELATIVE
    report_path.parent.mkdir(parents=True, exist_ok=True)
    decision = "READY" if not state.errors else "BLOCKED"
    report = {
        "report_id": "compatibility-g5",
        "gate": "G5",
        "scope": "T049/T050 metadata-only model compatibility; no G6 or execution activity",
        "decision": decision,
        "validated_at_utc": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "model": {"repository_id": MODEL_REPOSITORY, "revision_sha": MODEL_REVISION},
        "dataset": {"repository_id": DATASET_REPOSITORY, "revision_sha": DATASET_REVISION, "transformation_version": TRANSFORMATION_VERSION},
        "runtime": state.runtime,
        "checks": state.checks,
        "blocking_issues": state.errors,
        "evidence": state.evidence,
        "execution_flags": {
            "model_loaded": False,
            "training_run": False,
            "inference_run": False,
            "dry_run": False,
            "forward_run": False,
            "backward_run": False,
            "weights_deserialized": False,
        },
        "prohibited_scope_confirmed": ["principal training", "dry run", "inference", "baseline", "forward", "backward", "checkpoint creation"],
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return report_path


def main() -> int:
    root = repo_root()
    state = ValidationState()
    try:
        external_root = resolved_external_root()
        state.add("approved_external_root", not is_within(root, external_root), str(external_root))
        validate_runtime(state, external_root, root)
        model_path = validate_model(state, root, external_root)
        dataset_dir = validate_dataset(state, root, external_root)
        config = validate_config_and_llamafactory(state, root, external_root, model_path, dataset_dir)
        validate_model_files_without_weights(state, model_path)
        if config:
            validate_template(state, config)
    except Exception as exc:
        state.add("validator_execution", False, repr(exc))
    report_path = write_report(state, root)
    print(json.dumps({"decision": "READY" if not state.errors else "BLOCKED", "report": str(report_path), "issues": state.errors}, ensure_ascii=False))
    return 0 if not state.errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
