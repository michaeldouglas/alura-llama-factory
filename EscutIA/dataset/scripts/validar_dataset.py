"""Validação independente e somente leitura da preparação inicial do EscutIA."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path
from typing import Any


LABELS = {"negativo", "neutro", "positivo"}
ROLES = {"system", "user", "assistant"}
PHONE = re.compile(r"(?<!\d)(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]?\d{4}(?!\d)")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    value = re.sub(r"\s+", " ", value).strip()
    return re.sub(r"[^\w\s]", "", value, flags=re.UNICODE)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validate(dataset_dir: Path) -> dict[str, Any]:
    info = load_json(dataset_dir / "dataset_info.json")
    manifest = load_json(dataset_dir / "manifesto_dataset.json")
    checks: dict[str, bool] = {}
    errors: list[str] = []
    alpaca_sets: dict[str, list[dict[str, Any]]] = {}
    conversational_sets: dict[str, list[dict[str, Any]]] = {}

    for name, description in info.items():
        path = dataset_dir / description["file_name"]
        if not path.exists():
            errors.append(f"Arquivo ausente: {path}")
            continue
        records = load_json(path)
        if description.get("formatting", "alpaca") == "sharegpt":
            conversational_sets[name] = records
            for index, record in enumerate(records):
                messages = record.get("messages")
                if not isinstance(messages, list) or len(messages) != 3:
                    errors.append(f"{name}[{index}] não tem três mensagens")
                    continue
                if {message.get("role") for message in messages} != ROLES:
                    errors.append(f"{name}[{index}] tem roles inválidos")
                if any(not isinstance(message.get("content"), str) or not message["content"].strip() for message in messages):
                    errors.append(f"{name}[{index}] tem conteúdo vazio")
        else:
            alpaca_sets[name] = records
            for index, record in enumerate(records):
                if set(record) != {"instruction", "input", "output"}:
                    errors.append(f"{name}[{index}] tem campos diferentes do Alpaca")
                if not record.get("instruction") or not record.get("input") or record.get("output") not in LABELS:
                    errors.append(f"{name}[{index}] tem valor inválido")
                if len(record.get("input", "")) > 280:
                    errors.append(f"{name}[{index}] ultrapassa 280 caracteres")
                if PHONE.search(record.get("input", "")):
                    errors.append(f"{name}[{index}] contém padrão de telefone")

    train = alpaca_sets.get("escutia_treino_alpaca", [])
    validation = alpaca_sets.get("escutia_validacao_alpaca", [])
    evaluation = alpaca_sets.get("escutia_avaliacao_alpaca", [])
    keys = {"treino": {normalize(row["input"]) for row in train}, "validacao": {normalize(row["input"]) for row in validation}, "avaliacao": {normalize(row["input"]) for row in evaluation}}
    overlaps = {"treino_x_validacao": len(keys["treino"] & keys["validacao"]), "treino_x_avaliacao": len(keys["treino"] & keys["avaliacao"]), "validacao_x_avaliacao": len(keys["validacao"] & keys["avaliacao"])}
    checks["alpaca_schema"] = not errors
    checks["sharegpt_schema"] = bool(conversational_sets) and not errors
    checks["split_isolation"] = not any(overlaps.values())
    checks["source_lineage"] = (dataset_dir / "trabalho" / "lineage.jsonl").exists()
    checks["frozen_evaluation"] = (dataset_dir / "avaliacao_congelada.jsonl").exists()
    checks["dataset_info"] = all(description.get("file_name") for description in info.values())
    checks["training_not_authorized"] = manifest.get("llamafactory", {}).get("training_authorized") is False
    counts = {name: dict(Counter(row.get("output") for row in records)) for name, records in {"treino": train, "validacao": validation, "avaliacao": evaluation}.items()}
    result = {"decision": "DATA_READY_FOR_SFT" if all(checks.values()) else "DATA_BLOCKED", "checks": checks, "counts": counts, "overlaps": overlaps, "errors": errors[:20]}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-dir", type=Path, default=Path(__file__).resolve().parents[1] / "dados")
    args = parser.parse_args()
    result = validate(args.dataset_dir)
    if result["decision"] != "DATA_READY_FOR_SFT":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
