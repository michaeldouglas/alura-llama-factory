"""API local para classificação de sentimentos do EscutIA.

O serviço baixa o modelo completo do Hugging Face para ``modelo/`` somente
quando os pesos ainda não estão presentes. Depois, mantém um único pipeline
carregado em memória durante a vida do processo.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Lock
from typing import Literal, cast

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import snapshot_download
from pydantic import BaseModel, Field
from transformers import pipeline
from transformers.utils import logging as transformers_logging

API_DIR = Path(__file__).resolve().parent
load_dotenv(API_DIR / ".env.local", override=False)

os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
transformers_logging.set_verbosity_error()

logger = logging.getLogger("escutia.api_modelos")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

MODEL_ID = os.getenv("HF_MODEL_ID", "mdba/escutia-lora")
configured_model_dir = Path(os.getenv("MODEL_DIR", "modelo")).expanduser()
MODEL_DIR = (
    configured_model_dir
    if configured_model_dir.is_absolute()
    else API_DIR / configured_model_dir
)
HF_TOKEN = os.getenv("HF_TOKEN") or None

SENTIMENT_LABELS = {"negativo", "neutro", "positivo"}
SYSTEM_PROMPT = (
    "Você é um roteador de sentimentos. Responda somente com JSON válido no "
    'formato {"sentimento":"negativo|neutro|positivo"}.'
)
INSTRUCTION = (
    "Classifique o sentimento predominante do texto como negativo, neutro ou "
    'positivo e responda somente com um JSON válido no formato {"sentimento":"<rotulo>"}.'
)

SentimentLabel = Literal["negativo", "neutro", "positivo"]


class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class SentimentResponse(BaseModel):
    sentiment: SentimentLabel
    model: str
    elapsed_ms: int


generator = None
model_lock = Lock()


def model_is_cached() -> bool:
    """Retorna true somente quando há pesos do modelo completo no diretório."""

    has_config = (MODEL_DIR / "config.json").is_file()
    has_tokenizer = any(
        (MODEL_DIR / name).is_file()
        for name in ("tokenizer.json", "tokenizer_config.json")
    )
    # adapter_model.safetensors sozinho não é um modelo executável. O teste
    # exige um peso com prefixo de modelo para evitar confundir o adapter LoRA
    # existente em EscutIA/huggingface/EscutIA_Modelo com o modelo completo.
    has_weights = any(
        path.name != "adapter_model.safetensors"
        for path in MODEL_DIR.glob("*.safetensors")
    ) or any(MODEL_DIR.glob("pytorch_model*.bin"))
    return has_config and has_tokenizer and has_weights


def ensure_model_files() -> bool:
    """Baixa o modelo para o cache local quando necessário.

    O retorno informa se o modelo já estava completo antes desta execução.
    Downloads interrompidos podem ser retomados pelo Hugging Face Hub.
    """

    was_cached = model_is_cached()
    if was_cached:
        return True

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Modelo não encontrado em %s; baixando %s", MODEL_DIR, MODEL_ID)
    snapshot_download(
        repo_id=MODEL_ID,
        repo_type="model",
        local_dir=str(MODEL_DIR),
        token=HF_TOKEN,
    )
    if not model_is_cached():
        raise RuntimeError(
            "O download terminou, mas não foram encontrados os pesos completos "
            f"em {MODEL_DIR}."
        )
    return False


def load_model() -> bool:
    """Carrega o pipeline uma única vez por processo."""

    global generator
    if generator is not None:
        return True

    with model_lock:
        if generator is not None:
            return True

        cache_hit = ensure_model_files()
        logger.info("Carregando pipeline de sentimento a partir de %s", MODEL_DIR)
        generator = pipeline(
            "text-generation",
            model=str(MODEL_DIR),
            device_map="auto",
        )
        logger.info("Pipeline pronto; cache local utilizado: %s", cache_hit)
        return cache_hit


def build_messages(text: str) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"{INSTRUCTION}\n\nTexto: {text}"},
    ]


def as_sentiment_label(value: object) -> SentimentLabel | None:
    if isinstance(value, str) and value in SENTIMENT_LABELS:
        return cast(SentimentLabel, value)
    return None


def parse_sentiment(value: str) -> SentimentLabel | None:
    match = re.search(r"\{.*?\}", value, flags=re.DOTALL)
    if match:
        try:
            result = json.loads(match.group(0))
            sentiment = as_sentiment_label(result.get("sentimento"))
            if sentiment is not None:
                return sentiment
        except (json.JSONDecodeError, AttributeError, TypeError):
            pass

    label_match = re.search(r"\b(negativo|neutro|positivo)\b", value.lower())
    return as_sentiment_label(label_match.group(1)) if label_match else None


def generate_sentiment(text: str) -> SentimentLabel:
    if generator is None:
        raise RuntimeError("O modelo ainda não foi carregado.")

    with model_lock:
        output = generator(
            build_messages(text),
            max_new_tokens=24,
            do_sample=False,
            return_full_text=False,
        )

    generated_text = output[0].get("generated_text", "")
    if isinstance(generated_text, list):
        last_message = generated_text[-1] if generated_text else {}
        generated_text = (
            last_message.get("content", "")
            if isinstance(last_message, dict)
            else str(last_message)
        )

    sentiment = parse_sentiment(str(generated_text))
    if sentiment is None:
        raise ValueError("O modelo não retornou um sentimento reconhecido.")
    return sentiment


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_model()
    yield


app = FastAPI(
    title="EscutIA API de Modelos",
    description="Serviço local de inferência do modelo de sentimentos do EscutIA.",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "model": MODEL_ID,
        "model_loaded": generator is not None,
        "model_cached": model_is_cached(),
    }


@app.post("/sentiment", response_model=SentimentResponse)
@app.post("/api/sentiment", response_model=SentimentResponse)
def sentiment(request: SentimentRequest) -> SentimentResponse:
    text = request.text.strip()
    if not text:
        raise HTTPException(
            status_code=422,
            detail="O campo text não pode ficar vazio.",
        )

    started_at = time.perf_counter()
    try:
        result = generate_sentiment(text)
    except ValueError as error:
        logger.warning("Resposta inválida do modelo: %s", error)
        raise HTTPException(
            status_code=502,
            detail="O modelo não retornou um sentimento válido.",
        ) from error
    except Exception as error:
        logger.exception("Falha durante a inferência")
        raise HTTPException(
            status_code=503,
            detail="Não foi possível executar o modelo agora.",
        ) from error

    return SentimentResponse(
        sentiment=result,
        model=MODEL_ID,
        elapsed_ms=round((time.perf_counter() - started_at) * 1000),
    )
