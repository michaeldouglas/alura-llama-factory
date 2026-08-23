"""Carrega o modelo base e o último adapter LoRA para inferência local."""

from __future__ import annotations

import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models" / "Qwen--Qwen2.5-0.5B-Instruct"
INSTRUCTION = "Classifique o sentimento do texto em exatamente uma palavra: positivo, neutro ou negativo."
LABELS = {"negativo", "neutro", "positivo"}


def latest_checkpoint() -> Path:
    checkpoints = [path for path in (ROOT / "outputs").glob("*/checkpoint-*") if path.is_dir()]
    if not checkpoints:
        raise SystemExit("Nenhum checkpoint encontrado. Execute primeiro: python scripts\\treinar.py --confirm")
    return max(checkpoints, key=lambda path: path.stat().st_mtime)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--text", help="texto para classificar; sem ele, usa o modo interativo")
    parser.add_argument("--adapter", type=Path, help="checkpoint LoRA; por padrão, usa o último criado")
    parser.add_argument("--device", choices=("xpu", "cpu"), default="xpu")
    return parser.parse_args()


def classify(text: str, model, tokenizer, torch, device: str) -> tuple[str, str]:
    encoded = tokenizer.apply_chat_template([{"role": "user", "content": INSTRUCTION + "\n" + text}], tokenize=True, add_generation_prompt=True, return_tensors="pt")
    if hasattr(encoded, "keys") and not hasattr(encoded, "ndim"):
        prompt = {key: value for key, value in encoded.items() if key in {"input_ids", "attention_mask"}}
    else:
        if encoded.ndim == 1:
            encoded = encoded.unsqueeze(0)
        prompt = {"input_ids": encoded, "attention_mask": encoded.new_ones(encoded.shape)}
    prompt = {key: value.to(device) for key, value in prompt.items()}
    with torch.inference_mode():
        generated = model.generate(**prompt, do_sample=False, num_beams=1, max_new_tokens=4, pad_token_id=tokenizer.eos_token_id)
    continuation = generated[:, prompt["input_ids"].shape[1] :]
    raw = tokenizer.decode(continuation[0], skip_special_tokens=True).strip()
    normalized = raw.casefold()
    return raw, normalized if normalized in LABELS else "<INVALID>"


def main() -> int:
    args = parse_args()
    adapter = args.adapter.resolve() if args.adapter else latest_checkpoint()
    if not MODEL_DIR.is_dir() or not (MODEL_DIR / "config.json").is_file():
        raise SystemExit("Modelo base ausente. Execute primeiro: python scripts\\baixar_modelo.py")
    if not adapter.is_dir():
        raise SystemExit(f"Adapter não encontrado: {adapter}")

    import os
    os.environ.update({"HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1", "TOKENIZERS_PARALLELISM": "false"})
    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    if args.device == "xpu":
        if not torch.xpu.is_available() or torch.xpu.device_count() != 1:
            raise SystemExit("XPU solicitada, mas não há exatamente um dispositivo disponível.")
        dtype = torch.bfloat16
    else:
        dtype = torch.float32
    device = torch.device(args.device)
    tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR), local_files_only=True, trust_remote_code=False, use_fast=True)
    base = AutoModelForCausalLM.from_pretrained(str(MODEL_DIR), local_files_only=True, trust_remote_code=False, use_safetensors=True, dtype=dtype).to(device)
    model = PeftModel.from_pretrained(base, str(adapter), is_trainable=False).to(device)
    model.eval()

    if args.text is not None:
        raw, label = classify(args.text, model, tokenizer, torch, device)
        print(f"Resposta bruta: {raw}\nClassificação: {label}")
        return 0
    print(f"Adapter usado: {adapter}\nModo interativo. Ctrl+C encerra.")
    while True:
        text = input("EscutIA> ").strip()
        if text:
            raw, label = classify(text, model, tokenizer, torch, device)
            print(f"Resposta bruta: {raw}\nClassificação: {label}")


if __name__ == "__main__":
    raise SystemExit(main())
