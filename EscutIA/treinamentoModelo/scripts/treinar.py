"""Executa o treinamento SFT+LoRA do curso usando somente esta pasta."""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import torch
import yaml


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models" / "Qwen--Qwen2.5-0.5B-Instruct"
DATA_DIR = ROOT / "data" / "derived"
TEMPLATE = ROOT / "config" / "sft-lora-template.yaml"


def checkpoint_number(path: Path) -> int:
    match = re.search(r"checkpoint-(\d+)$", path.name)
    return int(match.group(1)) if match else -1


def register_final_model(output_dir: Path) -> Path:
    checkpoints = [path for path in output_dir.glob("checkpoint-*") if path.is_dir()]
    if not checkpoints:
        raise SystemExit(f"Treinamento terminou sem checkpoint em {output_dir}")
    final_checkpoint = max(checkpoints, key=checkpoint_number)
    pointer = ROOT / "outputs" / "ULTIMO_TREINAMENTO.txt"
    pointer.write_text(
        "MODELO TREINADO DO ESCUTIA\n"
        "==========================\n"
        f"Pasta da execução: {output_dir.relative_to(ROOT)}\n"
        f"Checkpoint final: {final_checkpoint.relative_to(ROOT)}\n"
        f"Caminho completo: {final_checkpoint}\n\n"
        "Para testar uma frase:\n"
        "python scripts\\testar_modelo.py --text \"Este produto melhorou muito a minha rotina.\"\n\n"
        "Para indicar este checkpoint explicitamente:\n"
        f"python scripts\\testar_modelo.py --adapter \"{final_checkpoint}\" --text \"Gostei do resultado.\"\n",
        encoding="utf-8",
    )
    return final_checkpoint


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--confirm", action="store_true", help="confirma que a configuração foi revisada")
    parser.add_argument("--output-name", help="nome da nova pasta dentro de outputs")
    parser.add_argument("--max-minutes", type=int, choices=range(1, 61), default=60)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.confirm:
        raise SystemExit("Treinamento bloqueado. Revise a configuração e execute novamente com --confirm.")
    if not MODEL_DIR.is_dir() or not (MODEL_DIR / "config.json").is_file():
        raise SystemExit("Modelo ausente. Execute primeiro: python scripts\\baixar_modelo.py")
    if not DATA_DIR.is_dir() or not (DATA_DIR / "train.jsonl").is_file() or not (DATA_DIR / "validation.jsonl").is_file():
        raise SystemExit("Dataset ausente. Execute primeiro: python scripts\\preparar_dataset.py")
    if not torch.xpu.is_available() or torch.xpu.device_count() != 1:
        raise SystemExit("Este curso exige exatamente uma Intel XPU disponível; fallback silencioso para CPU é proibido.")

    output_name = args.output_name or f"sft-lora-{dt.datetime.now():%Y%m%d-%H%M%S}"
    output_dir = ROOT / "outputs" / output_name
    if output_dir.exists():
        raise SystemExit(f"A saída já existe: {output_dir}. Use outro --output-name.")
    output_dir.mkdir(parents=True)
    log_dir = output_dir / "logs"
    log_dir.mkdir()

    config = yaml.safe_load(TEMPLATE.read_text(encoding="utf-8"))
    config["model_name_or_path"] = str(MODEL_DIR.resolve()).replace("\\", "/")
    config["dataset_dir"] = str(DATA_DIR.resolve()).replace("\\", "/")
    config["output_dir"] = str(output_dir.resolve()).replace("\\", "/")
    config["logging_dir"] = str(log_dir.resolve()).replace("\\", "/")
    generated_config = output_dir / "training-config.yaml"
    generated_config.write_text(yaml.safe_dump(config, sort_keys=False, allow_unicode=True), encoding="utf-8")

    cli = shutil.which("llamafactory-cli")
    if cli is None:
        candidate = Path(sys.executable).with_name("llamafactory-cli.exe")
        cli = str(candidate) if candidate.exists() else None
    if cli is None:
        raise SystemExit("llamafactory-cli não encontrado. Ative .venv e instale requirements.txt.")

    env = os.environ.copy()
    env.update({"HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1", "HF_DATASETS_OFFLINE": "1", "TOKENIZERS_PARALLELISM": "false", "PYTHONUNBUFFERED": "1"})
    stdout = (log_dir / "train.stdout.log").open("w", encoding="utf-8")
    stderr = (log_dir / "train.stderr.log").open("w", encoding="utf-8")
    try:
        print(f"Treinamento iniciado. Saída: {output_dir}")
        process = subprocess.Popen([cli, "train", str(generated_config)], cwd=ROOT, env=env, stdout=stdout, stderr=stderr)
        try:
            process.wait(timeout=args.max_minutes * 60)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
            raise SystemExit(f"Limite de {args.max_minutes} minutos atingido. Logs preservados em {log_dir}")
        if process.returncode != 0:
            raise SystemExit(f"LLaMA-Factory terminou com código {process.returncode}. Consulte {log_dir}")
    finally:
        stdout.close()
        stderr.close()
    final_checkpoint = register_final_model(output_dir)
    print("\nTREINAMENTO CONCLUIDO")
    print(f"Checkpoint final: {final_checkpoint}")
    print(f"Atalho com instrucoes: {ROOT / 'outputs' / 'ULTIMO_TREINAMENTO.txt'}")
    print('Para testar: python scripts\\testar_modelo.py --text "Este produto melhorou muito a minha rotina."')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
