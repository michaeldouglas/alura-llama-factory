"""G6 representative microbatch and frozen-baseline validation.

This is deliberately not a training entry point.  It loads the approved base
model, runs one forward/backward microbatch without an optimizer, and evaluates
the deterministic frozen subset (30 records per class).  It never writes model
weights, checkpoints, logs, or dataset files.
"""

from __future__ import annotations

import hashlib
import json
import os
import platform
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


EXPERIMENT_ID = "001-resource-efficient-finetune"
MODEL_REVISION = "7ae557604adf67be50417f59c2c2f167def9a775"
DATASET_REVISION = "606156db529f327fd871515cccbe14dcbafef682"
TRANSFORMATION_VERSION = "transformation-v1"
INSTRUCTION = "Classifique o sentimento do texto em exatamente uma palavra: positivo, neutro ou negativo."
LABELS = ("negativo", "neutro", "positivo")
EXPECTED_PYTHON = "3.12.12"
EXPECTED_TORCH_PREFIX = "2.9.1+xpu"
EXPECTED_LLAMAFACTORY = "0.9.5"
REPORT_RELATIVE = Path("experiments/001-resource-efficient-finetune/reports/benchmark-g6.json")
CONFIG_RELATIVE = Path("experiments/001-resource-efficient-finetune/configs/sft-lora-proposal.yaml")
G6_RELATIVE = Path("experiments/001-resource-efficient-finetune/manifests/gates/g6-review.json")
G5_RELATIVE = Path("experiments/001-resource-efficient-finetune/manifests/gates/g5-compatibility.json")
G4_RELATIVE = Path("experiments/001-resource-efficient-finetune/manifests/gates/g4-derived.json")
DATASET_RELATIVE = Path("experiments/001-resource-efficient-finetune/manifests/dataset-info.json")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def external_root() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if not local_app_data:
        raise RuntimeError("LOCALAPPDATA is unavailable; no fallback path is allowed")
    return (Path(local_app_data) / "alura-llama-factory" / EXPERIMENT_ID).resolve()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_json(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as stream:
        return json.load(stream)


def sync_xpu(torch: Any) -> None:
    if hasattr(torch, "xpu") and torch.xpu.is_available():
        torch.xpu.synchronize()


def encode_messages(tokenizer: Any, messages: list[dict[str, str]], *, generation: bool) -> Any:
    encoded = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=generation,
        return_tensors="pt",
    )
    if hasattr(encoded, "keys") and not hasattr(encoded, "ndim"):
        return {name: encoded[name] for name in encoded.keys() if name in {"input_ids", "attention_mask"}}
    if encoded.ndim == 1:
        encoded = encoded.unsqueeze(0)
    return {"input_ids": encoded, "attention_mask": encoded.new_ones(encoded.shape)}


def macro_f1(y_true: list[str], y_pred: list[str]) -> float:
    scores: list[float] = []
    for label in LABELS:
        tp = sum(actual == label and predicted == label for actual, predicted in zip(y_true, y_pred))
        fp = sum(actual != label and predicted == label for actual, predicted in zip(y_true, y_pred))
        fn = sum(actual == label and predicted != label for actual, predicted in zip(y_true, y_pred))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        scores.append(2 * precision * recall / (precision + recall) if precision + recall else 0.0)
    return sum(scores) / len(scores)


def select_frozen_subset(path: Path) -> tuple[list[dict[str, str]], dict[str, Any]]:
    records: list[dict[str, str]] = []
    with path.open("r", encoding="utf-8") as stream:
        for line_number, line in enumerate(stream, 1):
            row = json.loads(line)
            if set(row) != {"instruction", "input", "output"}:
                raise ValueError(f"frozen-test line {line_number} has an invalid schema")
            if row["instruction"] != INSTRUCTION or row["output"] not in LABELS:
                raise ValueError(f"frozen-test line {line_number} diverges from the frozen policy")
            records.append(row)
    selected: list[dict[str, str]] = []
    selected_indices: list[int] = []
    for label in LABELS:
        matches = [(index, row) for index, row in enumerate(records) if row["output"] == label]
        if len(matches) < 30:
            raise ValueError(f"frozen-test has fewer than 30 records for {label}")
        for index, row in matches[:30]:
            selected_indices.append(index)
            selected.append(row)
    selection = {
        "source": "frozen-test.jsonl",
        "selection_rule": "first 30 records in file order for each label, label order negativo/neutro/positivo",
        "record_count": len(selected),
        "class_counts": dict(sorted(Counter(row["output"] for row in selected).items())),
        "source_indices": selected_indices,
        "selection_sha256": sha256_json(selected_indices),
    }
    return selected, selection


def main() -> int:
    root = repo_root()
    report_path = root / REPORT_RELATIVE
    if report_path.exists():
        raise RuntimeError(f"refusing to overwrite existing report: {report_path}")

    started = time.perf_counter()
    g6 = load_json(root / G6_RELATIVE)
    g5 = load_json(root / G5_RELATIVE)
    g4 = load_json(root / G4_RELATIVE)
    dataset_manifest = load_json(root / DATASET_RELATIVE)
    if g6.get("decision") != "READY_FOR_DRY_VALIDATION":
        raise RuntimeError("G6 is not READY_FOR_DRY_VALIDATION")
    if g5.get("decision") != "READY":
        raise RuntimeError("G5 compatibility is not READY")
    if g4.get("decision") != "DATA_READY" or g4.get("training_authorized") is not False:
        raise RuntimeError("G4-DERIVED is not DATA_READY with training still closed")

    try:
        from omegaconf import OmegaConf
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch
        import llamafactory
    except Exception as exc:
        raise RuntimeError(f"approved runtime imports failed: {exc!r}") from exc

    config = OmegaConf.to_container(OmegaConf.load(root / CONFIG_RELATIVE), resolve=True)
    model_path = Path(str(config["model_name_or_path"])).resolve()
    data_dir = Path(str(config["dataset_dir"])).resolve()
    expected_data_dir = external_root() / "data-derived" / "cardiffnlp--tweet_sentiment_multilingual" / DATASET_REVISION / TRANSFORMATION_VERSION
    if model_path == root or not model_path.is_dir() or data_dir != expected_data_dir or not data_dir.is_dir():
        raise RuntimeError("approved external model/dataset paths are not the active paths")
    output_dir = Path(str(config["output_dir"])).resolve()
    if output_dir.exists():
        raise RuntimeError(f"proposed output already exists; refusing collision: {output_dir}")

    frozen_path = data_dir / "frozen-test.jsonl"
    frozen, selection = select_frozen_subset(frozen_path)
    input_hashes = {
        "config": sha256_file(root / CONFIG_RELATIVE),
        "g6_review": sha256_file(root / G6_RELATIVE),
        "g5_compatibility": sha256_file(root / G5_RELATIVE),
        "g4_derived": sha256_file(root / G4_RELATIVE),
        "dataset_manifest": sha256_file(root / DATASET_RELATIVE),
        "frozen_test": sha256_file(frozen_path),
    }

    runtime: dict[str, Any] = {
        "python": platform.python_version(),
        "python_executable": str(Path(sys.executable).resolve()),
        "torch": str(torch.__version__),
        "llamafactory": getattr(llamafactory, "__version__", None),
        "xpu_available": bool(torch.xpu.is_available()),
        "xpu_device_count": int(torch.xpu.device_count()) if torch.xpu.is_available() else 0,
        "device": "xpu",
    }
    if (
        runtime["python"] != EXPECTED_PYTHON
        or not runtime["python_executable"].endswith("py312-xpu\\Scripts\\python.exe")
        or not runtime["torch"].startswith(EXPECTED_TORCH_PREFIX)
        or runtime["llamafactory"] != EXPECTED_LLAMAFACTORY
        or not runtime["xpu_available"]
        or runtime["xpu_device_count"] != 1
    ):
        raise RuntimeError(f"runtime does not match G6 approval: {runtime}")

    torch.manual_seed(42)
    if hasattr(torch, "xpu"):
        torch.xpu.manual_seed_all(42)
        torch.xpu.reset_peak_memory_stats()
    device = torch.device("xpu")
    load_started = time.perf_counter()
    tokenizer = AutoTokenizer.from_pretrained(str(model_path), local_files_only=True, trust_remote_code=False, use_fast=True)
    model = AutoModelForCausalLM.from_pretrained(
        str(model_path),
        local_files_only=True,
        trust_remote_code=False,
        torch_dtype=torch.bfloat16,
        use_safetensors=True,
    )
    model.to(device)
    sync_xpu(torch)
    load_seconds = time.perf_counter() - load_started
    model_device = str(next(model.parameters()).device)
    if not model_device.startswith("xpu"):
        raise RuntimeError(f"model did not remain on XPU: {model_device}")

    # The one representative microbatch deliberately omits optimizer creation
    # and optimizer.step().  This records numerical compatibility only.
    microbatch = frozen[0]
    model.train()
    micro_inputs = encode_messages(
        tokenizer,
        [
            {"role": "user", "content": microbatch["instruction"] + "\n" + microbatch["input"]},
            {"role": "assistant", "content": microbatch["output"]},
        ],
        generation=False,
    )
    micro_inputs = {name: value.to(device) for name, value in micro_inputs.items()}
    sync_xpu(torch)
    forward_started = time.perf_counter()
    outputs = model(**micro_inputs, labels=micro_inputs["input_ids"])
    loss = outputs.loss
    loss_value = float(loss.detach().float().cpu().item())
    loss.backward()
    sync_xpu(torch)
    forward_backward_seconds = time.perf_counter() - forward_started
    gradients_finite = all(
        parameter.grad is None or bool(torch.isfinite(parameter.grad.detach()).all().item())
        for parameter in model.parameters()
    )
    model.zero_grad(set_to_none=True)
    if not torch.isfinite(loss.detach()).item() or not gradients_finite:
        raise RuntimeError(f"microbatch produced non-finite values: loss={loss_value}, gradients_finite={gradients_finite}")

    # Frozen baseline: deterministic greedy generation, no sampling and no
    # mutation of model parameters.  Only metrics are persisted, never text.
    model.eval()
    predictions: list[str] = []
    baseline_started = time.perf_counter()
    with torch.inference_mode():
        for row in frozen:
            prompt = encode_messages(
                tokenizer,
                [{"role": "user", "content": row["instruction"] + "\n" + row["input"]}],
                generation=True,
            )
            prompt = {name: value.to(device) for name, value in prompt.items()}
            generated = model.generate(
                **prompt,
                do_sample=False,
                num_beams=1,
                max_new_tokens=4,
                pad_token_id=tokenizer.eos_token_id,
            )
            new_tokens = generated[:, prompt["input_ids"].shape[1] :]
            prediction = tokenizer.decode(new_tokens[0], skip_special_tokens=True).strip().casefold()
            predictions.append(prediction)
    sync_xpu(torch)
    baseline_seconds = time.perf_counter() - baseline_started
    y_true = [row["output"] for row in frozen]
    valid_predictions = [prediction if prediction in LABELS else "<INVALID>" for prediction in predictions]
    correct = sum(actual == predicted for actual, predicted in zip(y_true, valid_predictions))
    invalid = sum(prediction == "<INVALID>" for prediction in valid_predictions)
    metrics = {
        "record_count": len(frozen),
        "class_counts": dict(sorted(Counter(y_true).items())),
        "accuracy": correct / len(frozen),
        "macro_f1": macro_f1(y_true, valid_predictions),
        "invalid_label_rate": invalid / len(frozen),
        "prediction_counts": dict(sorted(Counter(valid_predictions).items())),
        "prediction_sequence_sha256": sha256_json(valid_predictions),
    }

    peak_memory = None
    if hasattr(torch, "xpu"):
        peak_memory = int(torch.xpu.max_memory_allocated())
    duration_seconds = time.perf_counter() - started
    report = {
        "report_id": "benchmark-g6",
        "gate": "G6",
        "decision": "PASS",
        "validated_at_utc": datetime.now(timezone.utc).isoformat(),
        "scope": "T052/T053 representative microbatch and frozen baseline only",
        "model": {"repository_id": "Qwen/Qwen2.5-0.5B-Instruct", "revision_sha": MODEL_REVISION, "path": str(model_path)},
        "dataset": {"revision_sha": DATASET_REVISION, "transformation_version": TRANSFORMATION_VERSION, "path": str(data_dir)},
        "input_hashes": input_hashes,
        "selection": selection,
        "runtime": runtime,
        "model_load": {"loaded": True, "weights_deserialized": True, "device": model_device, "seconds": load_seconds},
        "microbatch": {
            "record_count": 1,
            "loss": loss_value,
            "loss_finite": True,
            "gradients_finite": gradients_finite,
            "forward_backward_seconds": forward_backward_seconds,
            "optimizer_created": False,
            "optimizer_step": False,
            "checkpoint_created": False,
        },
        "frozen_baseline": {"evaluation_mode": "greedy generation; do_sample=false; num_beams=1; max_new_tokens=4", "seconds": baseline_seconds, "metrics": metrics},
        "resource_observation": {"peak_xpu_memory_allocated_bytes": peak_memory, "total_seconds": duration_seconds, "hard_stop_seconds": 3600},
        "execution_flags": {
            "model_loaded": True,
            "weights_deserialized": True,
            "forward_run": True,
            "backward_run": True,
            "baseline_run": True,
            "inference_run": True,
            "optimizer_update": False,
            "training_run": False,
            "checkpoint_created": False,
            "principal_training": False,
        },
        "authorized_scope_confirmed": ["representative microbatch", "frozen baseline"],
        "prohibited_scope_confirmed": ["optimizer update", "checkpoint creation", "principal training"],
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    print(json.dumps({"decision": "PASS", "report": str(report_path), "metrics": metrics}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
