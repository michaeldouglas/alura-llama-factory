"""Monta um pacote enxuto do adapter LoRA para publicação futura.

O script lê os artefatos já gerados em ``EscutIA/fine_tuning_lora/outputs``
e cria ``EscutIA/huggingface/modelos/lora.zip``. A pasta de resultados do treinamento
não é modificada e checkpoints/arquivos de otimização não são empacotados.

Uso, a partir de qualquer diretório:

    python preparar_lora_zip.py
"""

from __future__ import annotations

import re
import zipfile
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
HF_DIR = SCRIPT_DIR.parent
PROJECT_DIR = HF_DIR.parent
LORA_DIR = PROJECT_DIR / "fine_tuning_lora"
OUTPUTS_DIR = LORA_DIR / "outputs"
ADAPTER_DIR = OUTPUTS_DIR / "resultados" / "lora_escutia_router"
CONFIG_PATH = LORA_DIR / "configs" / "lora_escutia.yaml"
ZIP_PATH = HF_DIR / "modelos" / "lora.zip"


def read_yaml_value(path: Path, key: str, default: str) -> str:
    """Lê uma chave simples do YAML sem exigir dependências adicionais."""

    if not path.exists():
        return default

    pattern = re.compile(rf"^\s*{re.escape(key)}\s*:\s*(.*?)\s*$")
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if match:
            value = match.group(1).strip().strip("'\"")
            return value or default
    return default


def add_file(
    archive: zipfile.ZipFile,
    source: Path,
    archive_name: str,
    included: list[str],
    required: bool = False,
) -> None:
    """Adiciona um arquivo ao ZIP ou informa sua ausência."""

    if not source.is_file():
        if required:
            raise FileNotFoundError(
                f"Arquivo obrigatório do adapter não encontrado: {source}"
            )
        return

    archive.write(source, arcname=f"escutia-lora/{archive_name}")
    included.append(archive_name)


def create_model_card(model_name: str, model_revision: str) -> str:
    """Cria o README mínimo que acompanhará o adapter no repositório."""

    return f"""---
base_model: {model_name}
base_model_relation: adapter
library_name: peft
language:
- pt
pipeline_tag: text-generation
tags:
- lora
- peft
- sentiment-analysis
- portuguese
---

# EscutIA LoRA

Adapter LoRA para classificação de sentimentos em português.

## Modelo-base

- modelo: `{model_name}`
- revisão: `{model_revision}`
- tarefa: classificação em `negativo`, `neutro` ou `positivo`

Este pacote contém um adapter LoRA, não um modelo completo. Para utilizar os
pesos, carregue o modelo-base compatível e aplique o adapter com PEFT.

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base = AutoModelForCausalLM.from_pretrained("{model_name}")
tokenizer = AutoTokenizer.from_pretrained("{model_name}")
model = PeftModel.from_pretrained(base, "SEU_USUARIO/escutia-lora")
```

Os arquivos de avaliação incluídos neste pacote registram os resultados
observados no conjunto congelado do projeto.
""".strip() + "\n"


def main() -> None:
    """Valida os artefatos e cria o pacote ``lora.zip``."""

    required_files = [
        ADAPTER_DIR / "adapter_config.json",
        ADAPTER_DIR / "adapter_model.safetensors",
    ]
    missing_files = [str(path) for path in required_files if not path.is_file()]
    if missing_files:
        raise FileNotFoundError(
            "Arquivos obrigatórios do adapter ausentes:\n- "
            + "\n- ".join(missing_files)
            + "\nExecute o treinamento LoRA antes de montar o ZIP."
        )

    model_name = read_yaml_value(
        CONFIG_PATH, "model_name_or_path", "Qwen/Qwen2.5-0.5B-Instruct"
    )
    model_revision = read_yaml_value(CONFIG_PATH, "model_revision", "não informada")

    included: list[str] = []
    with zipfile.ZipFile(
        ZIP_PATH, mode="w", compression=zipfile.ZIP_DEFLATED
    ) as archive:
        add_file(
            archive,
            ADAPTER_DIR / "adapter_config.json",
            "adapter_config.json",
            included,
            required=True,
        )
        add_file(
            archive,
            ADAPTER_DIR / "adapter_model.safetensors",
            "adapter_model.safetensors",
            included,
            required=True,
        )

        # Arquivos necessários para carregar o tokenizer e reproduzir o contexto.
        for name in (
            "tokenizer_config.json",
            "tokenizer.json",
            "special_tokens_map.json",
            "added_tokens.json",
            "chat_template.jinja",
            "merges.txt",
            "vocab.json",
        ):
            add_file(archive, ADAPTER_DIR / name, name, included)

        # Configuração e resultados úteis para documentação/auditoria.
        add_file(archive, CONFIG_PATH, "lora_escutia.yaml", included)
        add_file(archive, ADAPTER_DIR / "train_results.json", "train_results.json", included)
        add_file(archive, ADAPTER_DIR / "eval_results.json", "eval_results.json", included)
        add_file(
            archive,
            OUTPUTS_DIR / "avaliacao" / "avaliacao_lora.json",
            "avaliacao_lora.json",
            included,
        )
        add_file(
            archive,
            OUTPUTS_DIR / "avaliacao" / "avaliacao_lora.csv",
            "avaliacao_lora.csv",
            included,
        )

        readme_info = zipfile.ZipInfo("escutia-lora/README.md")
        readme_info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(readme_info, create_model_card(model_name, model_revision))
        included.append("README.md")

    print(f"Pacote LoRA criado: {ZIP_PATH}")
    print("Arquivos incluídos:")
    for name in sorted(included):
        print(f"- {name}")
    print("Checkpoints e arquivos de otimização não foram incluídos.")


if __name__ == "__main__":
    main()
