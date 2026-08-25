"""Valida os artefatos preparados do dataset sem acessar outras pastas."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PREPARED_DIR = ROOT / "dados" / "preparados"
REPORT_PATH = ROOT / "dados" / "relatorios" / "11_validacao_final.json"
LABELS = {"negativo", "neutro", "positivo"}
SPLITS = {
    "treino": PREPARED_DIR / "escutia_train.json",
    "validacao": PREPARED_DIR / "escutia_validation.json",
    "avaliacao": PREPARED_DIR / "escutia_evaluation.json",
}


def carregar(caminho: Path):
    if not caminho.exists():
        raise FileNotFoundError(f"Artefato não encontrado: {caminho}")
    return json.loads(caminho.read_text(encoding="utf-8"))


def validar() -> None:
    entradas_por_split: dict[str, set[str]] = {}

    for nome, caminho in SPLITS.items():
        registros = carregar(caminho)
        if not isinstance(registros, list) or not registros:
            raise ValueError(f"O split {nome} precisa ser uma lista não vazia.")

        entradas: set[str] = set()
        labels: dict[str, int] = {label: 0 for label in sorted(LABELS)}
        for indice, item in enumerate(registros):
            if set(item) != {"instruction", "input", "output"}:
                raise ValueError(f"{nome}[{indice}] possui campos inválidos.")
            entrada = item["input"]
            if not isinstance(entrada, str) or not entrada.strip():
                raise ValueError(f"{nome}[{indice}] possui entrada vazia.")
            if entrada in entradas:
                raise ValueError(f"Entrada duplicada dentro do split {nome}: índice {indice}.")

            resposta = json.loads(item["output"])
            if set(resposta) != {"sentimento"} or resposta["sentimento"] not in LABELS:
                raise ValueError(f"{nome}[{indice}] possui resposta JSON inválida.")
            entradas.add(entrada)
            labels[resposta["sentimento"]] += 1

        entradas_por_split[nome] = entradas
        print(f"{nome}: {len(registros)} registros | rótulos: {labels}")

    nomes = list(entradas_por_split)
    for indice, primeiro in enumerate(nomes):
        for segundo in nomes[indice + 1 :]:
            intersecao = entradas_por_split[primeiro] & entradas_por_split[segundo]
            if intersecao:
                raise ValueError(f"Há {len(intersecao)} entradas compartilhadas entre {primeiro} e {segundo}.")

    if not REPORT_PATH.exists():
        raise FileNotFoundError(f"Relatório final não encontrado: {REPORT_PATH}")
    relatorio = carregar(REPORT_PATH)
    if relatorio.get("decisao") != "DATA_READY_FOR_SFT":
        raise ValueError(f"Gate final não aprovado: {relatorio.get('decisao')}")

    print("Isolamento entre os splits: PASS")
    print("Gate final do dataset: PASS")


if __name__ == "__main__":
    try:
        validar()
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as error:
        print(f"VALIDAÇÃO BLOQUEADA: {error}", file=sys.stderr)
        raise SystemExit(1) from error
