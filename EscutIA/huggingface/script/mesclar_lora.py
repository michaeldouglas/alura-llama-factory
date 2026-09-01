"""Mescla o adapter LoRA do EscutIA ao modelo-base e salva o modelo completo."""

from __future__ import annotations

import re
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
HF_DIR = SCRIPT_DIR.parent
PROJECT_DIR = HF_DIR.parent
ADAPTER_DIR = (
    PROJECT_DIR
    / "fine_tuning_lora"
    / "outputs"
    / "resultados"
    / "lora_escutia_router"
)
CONFIG_PATH = PROJECT_DIR / "fine_tuning_lora" / "configs" / "lora_escutia.yaml"
OUTPUT_DIR = HF_DIR / "modelos" / "completos" / "escutia-lora"


def read_yaml_value(path: Path, key: str, default: str) -> str:
    """Lê uma chave simples do YAML sem exigir PyYAML."""

    if not path.exists():
        return default

    pattern = re.compile(rf"^\s*{re.escape(key)}\s*:\s*(.*?)\s*$")
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if match:
            value = match.group(1).strip().strip("'\"")
            return value or default
    return default


def create_model_card(model_name: str, model_revision: str) -> str:
    """Cria o Model Card do modelo já mesclado."""

    return f"""---
base_model: {model_name}
base_model_relation: finetune
library_name: transformers
language:
- pt
pipeline_tag: text-generation
tags:
- fine-tuned
- lora
- merged
- sentiment-analysis
- portuguese
---

# EscutIA LoRA — Modelo completo

Modelo LoRA mesclado ao modelo-base para classificação de sentimentos em
português. Este repositório contém todos os pesos necessários para carregar o
modelo diretamente com `transformers`.

## Modelo-base

- modelo: `{model_name}`
- revisão: `{model_revision}`
- técnica de treinamento: LoRA

## Uso

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model_id = "mdba/escutia-lora"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id)
```

Este modelo já contém as alterações aprendidas no treinamento e não precisa
carregar um adapter PEFT separadamente.
""".strip() + "\n"


def main() -> None:
    """Executa o merge sem sobrescrever um modelo completo existente."""

    required_files = [
        ADAPTER_DIR / "adapter_config.json",
        ADAPTER_DIR / "adapter_model.safetensors",
    ]
    missing_files = [str(path) for path in required_files if not path.is_file()]
    if missing_files:
        raise FileNotFoundError(
            "Arquivos obrigatórios do adapter LoRA ausentes:\n- "
            + "\n- ".join(missing_files)
            + "\nExecute o treinamento LoRA antes do merge."
        )

    if OUTPUT_DIR.exists():
        raise FileExistsError(
            f"O diretório de modelo completo já existe e não será sobrescrito: {OUTPUT_DIR}"
        )

    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    model_name = read_yaml_value(
        CONFIG_PATH, "model_name_or_path", "Qwen/Qwen2.5-0.5B-Instruct"
    )
    model_revision = read_yaml_value(CONFIG_PATH, "model_revision", "não informada")

    print(f"[1/5] Carregando modelo-base: {model_name}", flush=True)
    base_model = AutoModelForCausalLM.from_pretrained(
        model_name,
        revision=model_revision,
        torch_dtype=torch.float16,
        low_cpu_mem_usage=True,
    )
    print("[2/5] Modelo-base carregado.", flush=True)
    print("[3/5] Carregando adapter LoRA treinado.", flush=True)
    adapter_model = PeftModel.from_pretrained(base_model, ADAPTER_DIR)
    print("[4/5] Incorporando o adapter ao modelo-base.", flush=True)
    merged_model = adapter_model.merge_and_unload(safe_merge=True)

    OUTPUT_DIR.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=False)
    print("[5/5] Salvando modelo completo e tokenizer.", flush=True)
    merged_model.save_pretrained(
        OUTPUT_DIR,
        safe_serialization=True,
        max_shard_size="2GB",
    )
    tokenizer = AutoTokenizer.from_pretrained(ADAPTER_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    (OUTPUT_DIR / "README.md").write_text(
        create_model_card(model_name, model_revision), encoding="utf-8"
    )

    print(f"Modelo LoRA completo salvo em: {OUTPUT_DIR}", flush=True)


if __name__ == "__main__":
    main()
