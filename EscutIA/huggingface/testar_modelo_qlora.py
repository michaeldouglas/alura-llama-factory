"""Baixa uma vez e testa o modelo QLoRA completo de sentimento do EscutIA.

Exemplo:

    python testar_modelo_qlora.py "Estou muito feliz hoje"

O repositório deve conter o modelo já mesclado ao modelo-base. Este script não
carrega um adapter PEFT separadamente.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path

os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")

from huggingface_hub import snapshot_download
from transformers import pipeline
from transformers.utils import logging


logging.set_verbosity_error()

MODEL_ID = "mdba/escutia-qlora"
MODEL_DIR = Path(__file__).resolve().parent / "EscutIA_Modelo_QLoRA"
LABELS = {"negativo", "neutro", "positivo"}
SYSTEM_PROMPT = (
    "Você é um roteador de sentimentos. Responda somente com JSON válido no "
    'formato {"sentimento":"negativo|neutro|positivo"}.'
)
INSTRUCTION = (
    "Classifique o sentimento predominante do texto como negativo, neutro ou "
    'positivo e responda somente com um JSON válido no formato {"sentimento":"<rotulo>"}.'
)


def modelo_em_cache() -> bool:
    """Confere se a pasta local contém configuração, tokenizer e pesos completos."""

    tem_config = (MODEL_DIR / "config.json").is_file()
    tem_tokenizer = any(
        (MODEL_DIR / nome).is_file()
        for nome in ("tokenizer.json", "tokenizer_config.json")
    )
    tem_pesos = any(MODEL_DIR.glob("*.safetensors")) or any(
        MODEL_DIR.glob("pytorch_model*.bin")
    )
    return tem_config and tem_tokenizer and tem_pesos


def resposta_json(texto: str) -> dict[str, object]:
    """Extrai e valida a resposta estruturada produzida pelo modelo."""

    trecho = re.search(r"\{.*?\}", texto, flags=re.DOTALL)
    if trecho:
        try:
            resultado = json.loads(trecho.group(0))
            if set(resultado) == {"sentimento"} and resultado["sentimento"] in LABELS:
                return resultado
        except (json.JSONDecodeError, TypeError):
            pass
    return {"sentimento": "não identificado"}


def main() -> None:
    """Baixa o modelo quando necessário e classifica o texto recebido."""

    if len(sys.argv) < 2 or not " ".join(sys.argv[1:]).strip():
        print('Uso: python testar_modelo_qlora.py "seu texto aqui"')
        raise SystemExit(1)

    inicio = time.perf_counter()
    texto = " ".join(sys.argv[1:]).strip()
    cache = modelo_em_cache()

    if not cache:
        MODEL_DIR.parent.mkdir(parents=True, exist_ok=True)
        snapshot_download(
            repo_id=MODEL_ID,
            repo_type="model",
            local_dir=str(MODEL_DIR),
            token=os.getenv("HF_TOKEN") or None,
        )

    modelo = pipeline(
        "text-generation",
        model=str(MODEL_DIR),
        device_map="auto",
    )
    mensagens = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"{INSTRUCTION}\n\nTexto: {texto}"},
    ]
    gerado = modelo(
        mensagens,
        max_new_tokens=24,
        do_sample=False,
        return_full_text=False,
    )[0]["generated_text"]
    if isinstance(gerado, list):
        gerado = gerado[-1].get("content", "")

    resultado = resposta_json(str(gerado))
    resultado["modelo"] = MODEL_ID
    resultado["cache"] = cache
    resultado["tempo_execucao_segundos"] = round(time.perf_counter() - inicio, 2)
    print(json.dumps(resultado, ensure_ascii=False))


if __name__ == "__main__":
    main()
