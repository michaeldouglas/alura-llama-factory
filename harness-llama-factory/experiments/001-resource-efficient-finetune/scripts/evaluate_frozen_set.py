"""G8 frozen base-versus-adapter evaluation.

Uses the exact 90-record frozen subset and deterministic generation settings
from benchmark-g6.json. It performs inference only and never changes weights.
"""

from __future__ import annotations

import gc
import hashlib
import json
import os
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
EXPECTED_BASE_SEQUENCE_HASH = "84b3d50548cbb759b6fa1362359273ebd330fc97ca41595cc0cf573da855c449"
REPORT_RELATIVE = Path("experiments/001-resource-efficient-finetune/reports/evaluation-g8.json")
BENCHMARK_RELATIVE = Path("experiments/001-resource-efficient-finetune/reports/benchmark-g6.json")
CONFIG_RELATIVE = Path("experiments/001-resource-efficient-finetune/configs/sft-lora-proposal-v3.yaml")
RUN_RELATIVE = Path("experiments/001-resource-efficient-finetune/manifests/experiment-run-v3.json")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def external_root() -> Path:
    value = os.environ.get("LOCALAPPDATA")
    if not value:
        raise RuntimeError("LOCALAPPDATA is unavailable")
    return (Path(value) / "alura-llama-factory" / EXPERIMENT_ID).resolve()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_json(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def macro_f1(y_true: list[str], y_pred: list[str]) -> float:
    values: list[float] = []
    for label in LABELS:
        tp = sum(a == label and p == label for a, p in zip(y_true, y_pred))
        fp = sum(a != label and p == label for a, p in zip(y_true, y_pred))
        fn = sum(a == label and p != label for a, p in zip(y_true, y_pred))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        values.append(2 * precision * recall / (precision + recall) if precision + recall else 0.0)
    return sum(values) / len(values)


def parse_prediction(value: str) -> str:
    normalized = value.strip().casefold()
    return normalized if normalized in LABELS else "<INVALID>"


def select_subset(path: Path) -> tuple[list[dict[str, str]], dict[str, Any]]:
    records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    selected: list[dict[str, str]] = []
    indices: list[int] = []
    for label in LABELS:
        matches = [(i, row) for i, row in enumerate(records) if row["output"] == label]
        if len(matches) < 30:
            raise RuntimeError(f"frozen-test has fewer than 30 records for {label}")
        for i, row in matches[:30]:
            if row["instruction"] != INSTRUCTION:
                raise RuntimeError("frozen instruction mismatch")
            selected.append(row)
            indices.append(i)
    return selected, {"record_count": len(selected), "class_counts": dict(sorted(Counter(row["output"] for row in selected).items())), "source_indices": indices, "selection_sha256": sha256_json(indices)}


def encode_prompt(tokenizer: Any, row: dict[str, str]) -> dict[str, Any]:
    encoded = tokenizer.apply_chat_template(
        [{"role": "user", "content": row["instruction"] + "\n" + row["input"]}],
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
    )
    if hasattr(encoded, "keys") and not hasattr(encoded, "ndim"):
        return {name: encoded[name] for name in encoded.keys() if name in {"input_ids", "attention_mask"}}
    if encoded.ndim == 1:
        encoded = encoded.unsqueeze(0)
    return {"input_ids": encoded, "attention_mask": encoded.new_ones(encoded.shape)}


def evaluate(model: Any, tokenizer: Any, torch: Any, rows: list[dict[str, str]], device: Any) -> tuple[list[str], float]:
    model.eval()
    predictions: list[str] = []
    started = time.perf_counter()
    with torch.inference_mode():
        for row in rows:
            prompt = {name: value.to(device) for name, value in encode_prompt(tokenizer, row).items()}
            generated = model.generate(
                **prompt,
                do_sample=False,
                num_beams=1,
                max_new_tokens=4,
                pad_token_id=tokenizer.eos_token_id,
            )
            continuation = generated[:, prompt["input_ids"].shape[1] :]
            predictions.append(tokenizer.decode(continuation[0], skip_special_tokens=True).strip().casefold())
    if hasattr(torch, "xpu") and torch.xpu.is_available():
        torch.xpu.synchronize()
    return predictions, time.perf_counter() - started


def summarize(y_true: list[str], predictions: list[str]) -> dict[str, Any]:
    parsed = [parse_prediction(value) for value in predictions]
    correct = sum(a == p for a, p in zip(y_true, parsed))
    invalid = sum(p == "<INVALID>" for p in parsed)
    return {
        "record_count": len(y_true),
        "class_counts": dict(sorted(Counter(y_true).items())),
        "accuracy": correct / len(y_true),
        "macro_f1": macro_f1(y_true, parsed),
        "invalid_label_rate": invalid / len(y_true),
        "prediction_counts": dict(sorted(Counter(parsed).items())),
        "prediction_sequence_sha256": sha256_json(parsed),
    }


def main() -> int:
    root = repo_root()
    report_path = root / REPORT_RELATIVE
    if report_path.exists():
        raise RuntimeError(f"refusing to overwrite {report_path}")
    benchmark = json.loads((root / BENCHMARK_RELATIVE).read_text(encoding="utf-8"))
    run = json.loads((root / RUN_RELATIVE).read_text(encoding="utf-8"))
    if run.get("status") != "COMPLETED" or run.get("exit_code") != 0:
        raise RuntimeError("G7-V3 run is not completed successfully")
    if benchmark.get("selection", {}).get("selection_sha256") != "517bab9d543de6f1e07b7ba5717f5b871dcafa8e14701c5dcffb237a0e2ed6f6":
        raise RuntimeError("benchmark frozen selection identity mismatch")

    try:
        from peft import PeftModel
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch
    except Exception as exc:
        raise RuntimeError(f"evaluation runtime imports failed: {exc!r}") from exc

    config_text = (root / CONFIG_RELATIVE).read_text(encoding="utf-8")
    from omegaconf import OmegaConf
    config = OmegaConf.to_container(OmegaConf.load(root / CONFIG_RELATIVE), resolve=True)
    model_path = Path(str(config["model_name_or_path"])).resolve()
    data_dir = Path(str(config["dataset_dir"])).resolve()
    expected_dir = external_root() / "data-derived" / "cardiffnlp--tweet_sentiment_multilingual" / DATASET_REVISION / TRANSFORMATION_VERSION
    checkpoint = external_root() / "runs" / "g5-sft-lora-transformation-v1-20260822-v3" / "checkpoint-448"
    if data_dir != expected_dir or not data_dir.is_dir() or not checkpoint.is_dir():
        raise RuntimeError("approved external dataset or checkpoint is unavailable")

    rows, selection = select_subset(data_dir / "frozen-test.jsonl")
    y_true = [row["output"] for row in rows]
    tokenizer = AutoTokenizer.from_pretrained(str(model_path), local_files_only=True, trust_remote_code=False, use_fast=True)
    device = torch.device("xpu")
    if not torch.xpu.is_available() or torch.xpu.device_count() != 1:
        raise RuntimeError("approved XPU is unavailable")

    base_model = AutoModelForCausalLM.from_pretrained(str(model_path), local_files_only=True, trust_remote_code=False, dtype=torch.bfloat16, use_safetensors=True).to(device)
    base_predictions, base_seconds = evaluate(base_model, tokenizer, torch, rows, device)
    base_metrics = summarize(y_true, base_predictions)
    if base_metrics["prediction_sequence_sha256"] != EXPECTED_BASE_SEQUENCE_HASH:
        raise RuntimeError("base prediction hash differs from frozen G6 baseline")
    del base_model
    gc.collect()
    torch.xpu.empty_cache()

    adapted_base = AutoModelForCausalLM.from_pretrained(str(model_path), local_files_only=True, trust_remote_code=False, dtype=torch.bfloat16, use_safetensors=True).to(device)
    adapted_model = PeftModel.from_pretrained(adapted_base, str(checkpoint), is_trainable=False).to(device)
    adapted_predictions, adapted_seconds = evaluate(adapted_model, tokenizer, torch, rows, device)
    adapted_metrics = summarize(y_true, adapted_predictions)
    del adapted_model
    del adapted_base
    gc.collect()
    torch.xpu.empty_cache()

    improvement = adapted_metrics["macro_f1"] - base_metrics["macro_f1"]
    threshold = 0.10 if base_metrics["macro_f1"] < 0.80 else 0.02
    valid_predictions = adapted_metrics["invalid_label_rate"] == 0.0
    successful = valid_predictions and improvement >= threshold and (base_metrics["macro_f1"] < 0.80 or adapted_metrics["accuracy"] >= base_metrics["accuracy"])
    checkpoint_hashes = {path.name: sha256_file(path) for path in sorted(checkpoint.iterdir()) if path.is_file() and path.suffix in {".safetensors", ".json", ".bin", ".pth", ".jinja"}}
    report = {
        "report_id": "evaluation-g8",
        "gate": "G8",
        "decision": "SUCCESSFUL" if successful else "UNSUCCESSFUL",
        "validated_at_utc": datetime.now(timezone.utc).isoformat(),
        "model_revision": MODEL_REVISION,
        "dataset_revision": DATASET_REVISION,
        "transformation_version": TRANSFORMATION_VERSION,
        "run_id": run["run_id"],
        "checkpoint": {"path": str(checkpoint), "files_sha256": checkpoint_hashes},
        "selection": selection,
        "generation": {"do_sample": False, "num_beams": 1, "max_new_tokens": 4, "parser": "trim, case-fold, exact one of negativo/neutro/positivo"},
        "base": {"metrics": base_metrics, "seconds": base_seconds, "prediction_hash_matches_g6": True},
        "adapted": {"metrics": adapted_metrics, "seconds": adapted_seconds},
        "comparison": {"macro_f1_improvement": improvement, "required_improvement": threshold, "all_predictions_valid": valid_predictions, "accuracy_delta": adapted_metrics["accuracy"] - base_metrics["accuracy"]},
        "execution_flags": {"base_inference": True, "adapted_inference": True, "training_run": False, "optimizer_update": False, "checkpoint_created_by_evaluation": False}
    }
    with report_path.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    print(json.dumps({"decision": report["decision"], "base": base_metrics, "adapted": adapted_metrics, "improvement": improvement}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
