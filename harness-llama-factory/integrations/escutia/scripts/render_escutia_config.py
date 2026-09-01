"""Render a LLaMA-Factory proposal for EscutIA without touching EscutIA."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from validate_escutia_integration import IntegrationError, load_profile, resolve_project_root, validate


def external_root() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    base = Path(local_app_data) if local_app_data else Path.home() / "AppData" / "Local"
    return base / "alura-llama-factory" / "escutia-integration"


def quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def render(profile: dict, project_root: Path, model_path: str | None = None) -> str:
    dataset_dir = project_root / profile["source_paths"]["dataset_dir"]
    run_root = external_root() / "runs" / "lora-escutia-router"
    cache_root = external_root() / "cache" / "model"
    model = model_path or profile["model"]["name_or_path"]
    lf = profile["llama_factory"]
    lines = [
        "# Generated proposal. It is not an authorization to train.",
        "# Rendered by the harness; EscutIA remains read-only.",
        f"model_name_or_path: {quote(model)}",
        f"model_revision: {quote(profile['model']['revision'])}",
        f"cache_dir: {quote(str(cache_root))}",
        f"dataset_dir: {quote(str(dataset_dir))}",
        f"dataset: {quote(profile['dataset']['train_name'])}",
        f"eval_dataset: {quote(profile['dataset']['validation_name'])}",
        f"stage: {quote(lf['stage'])}",
        "do_train: true",
        "do_eval: true",
        f"finetuning_type: {quote(lf['finetuning_type'])}",
        f"template: {quote(lf['template'])}",
        f"seed: {lf['seed']}",
        f"cutoff_len: {lf['cutoff_len']}",
        f"per_device_train_batch_size: {lf['train_batch_size']}",
        f"per_device_eval_batch_size: {lf['eval_batch_size']}",
        f"gradient_accumulation_steps: {lf['gradient_accumulation_steps']}",
        f"learning_rate: {lf['learning_rate']}",
        f"num_train_epochs: {lf['num_train_epochs']}",
        "lr_scheduler_type: cosine",
        "warmup_ratio: 0.05",
        "gradient_checkpointing: true",
        f"lora_target: {quote(lf['lora_target'])}",
        f"lora_rank: {lf['lora_rank']}",
        f"lora_alpha: {lf['lora_alpha']}",
        f"lora_dropout: {lf['lora_dropout']}",
        "bf16: true",
        "fp16: false",
        "dataloader_num_workers: 0",
        "eval_strategy: epoch",
        "save_strategy: epoch",
        "save_total_limit: 2",
        "overwrite_output_dir: false",
        "report_to: none",
        "run_name: lora_escutia_router_harness",
        f"output_dir: {quote(str(run_root))}",
        f"logging_dir: {quote(str(run_root / 'logs'))}",
    ]
    return "\n".join(lines) + "\n"


def approved_output(path: Path) -> bool:
    resolved = path.expanduser().resolve()
    root = external_root().resolve()
    return resolved == root or root in resolved.parents


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-root", help="Existing EscutIA directory; defaults to ../EscutIA")
    parser.add_argument("--model-path", help="Optional local model path; otherwise use the pinned model id")
    parser.add_argument("--output", type=Path, help="Optional output under the approved external root")
    args = parser.parse_args(argv)
    try:
        profile = load_profile()
        project_root = resolve_project_root(args.project_root, profile)
        validate(profile, project_root)
        rendered = render(profile, project_root, args.model_path)
        if args.output:
            if not approved_output(args.output):
                raise IntegrationError("Rendered configs may only be written below the external integration root.")
            args.output.parent.mkdir(parents=True, exist_ok=True)
            if args.output.exists():
                raise IntegrationError(f"Refusing to overwrite existing config: {args.output}")
            args.output.write_text(rendered, encoding="utf-8", newline="\n")
            print(f"WROTE_EXTERNAL_CONFIG={args.output.resolve()}")
        else:
            print(rendered, end="")
    except (OSError, IntegrationError) as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
