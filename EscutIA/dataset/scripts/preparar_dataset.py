"""Prepara o dataset EscutIA com resposta JSON estruturada.

Lê somente os arquivos de origem dentro de ``dataset/dados`` e gera os
artefatos em ``dataset/dados/trabalho``, ``preparados`` e ``relatorios``.
"""

from __future__ import annotations

import csv
import hashlib
import json
import random
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "dados"
SOURCE_FILE = DATA_DIR / "dataset.csv"
LOCAL_SOURCE_FILE = DATA_DIR / "dataset_local.csv"
WORK_DIR = DATA_DIR / "trabalho"
PREPARED_DIR = DATA_DIR / "preparados"
REPORTS_DIR = DATA_DIR / "relatorios"

LABELS = {"negativo", "neutro", "positivo"}
MAX_TEXT_LENGTH = 280
SEED = 42
INSTRUCTION = (
    "Classifique o sentimento predominante do texto como negativo, neutro ou "
    "positivo e responda somente com um JSON válido no formato "
    '{"sentimento":"<rotulo>"}.'
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize(value: Any) -> str:
    value = unicodedata.normalize("NFKC", str(value or ""))
    return re.sub(r"\s+", " ", value).strip()


def comparison_key(value: str) -> str:
    value = normalize(value).casefold()
    return re.sub(r"[^\w\s]", "", value, flags=re.UNICODE)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")


def ensure_sources() -> None:
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(f"Fonte principal não encontrada dentro do dataset: {SOURCE_FILE}")
    if not LOCAL_SOURCE_FILE.exists():
        raise FileNotFoundError(f"Fonte local não encontrada dentro do dataset: {LOCAL_SOURCE_FILE}")


def ensure_output_is_empty() -> None:
    for directory in (WORK_DIR, PREPARED_DIR, REPORTS_DIR):
        if directory.exists() and any(path.name != ".gitkeep" for path in directory.rglob("*")):
            raise FileExistsError(
                f"A pasta de saída já contém artefatos: {directory}. "
                "Limpe conscientemente os resultados antes de executar novamente."
            )


def read_source() -> list[dict[str, str]]:
    with SOURCE_FILE.open("r", encoding="utf-8-sig", newline="") as stream:
        rows = list(csv.DictReader(stream))
    if not rows:
        raise ValueError("A fonte dataset/dados/dataset.csv está vazia.")
    expected = {"id", "texto", "rotulo"}
    if set(rows[0]) != expected:
        raise ValueError(f"Schema inesperado: {set(rows[0])}; esperado: {expected}.")
    return rows


def prepare_rows(raw_rows: list[dict[str, str]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    prepared: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    lineage: list[dict[str, Any]] = []
    by_text: dict[str, dict[str, Any]] = {}
    seen_ids: set[str] = set()

    for row_number, raw in enumerate(raw_rows, start=2):
        item_id = normalize(raw.get("id"))
        text = normalize(raw.get("texto"))
        label = normalize(raw.get("rotulo")).casefold()
        base = {
            "source_id": item_id,
            "source_row": row_number,
            "source_text_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "source_label": label,
            "rejection_reason": None,
            "split": None,
        }

        if not item_id or not text or label not in LABELS or len(text) > MAX_TEXT_LENGTH:
            reason = "invalid_schema_label_or_length"
            rejected.append({**base, "text": text, "reason": reason})
            lineage.append({**base, "rejection_reason": reason})
            continue
        if item_id in seen_ids:
            reason = "duplicate_id"
            rejected.append({**base, "text": text, "reason": reason})
            lineage.append({**base, "rejection_reason": reason})
            continue

        key = comparison_key(text)
        record = {
            **base,
            "instruction": INSTRUCTION,
            "input": text,
            "output_label": label,
            "comparison_key": key,
        }
        previous = by_text.get(key)
        if previous:
            reason = "conflicting_duplicate_labels" if previous["output_label"] != label else "normalized_duplicate"
            rejected.append({**record, "reason": reason})
            lineage.append({**base, "rejection_reason": reason})
            continue

        seen_ids.add(item_id)
        by_text[key] = record
        prepared.append(record)
        lineage.append(base)

    return prepared, rejected, lineage


def split_stratified(rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    randomizer = random.Random(SEED)
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[row["output_label"]].append(row)

    splits = {"treino": [], "validacao": [], "avaliacao": []}
    for label in sorted(grouped):
        group = list(grouped[label])
        randomizer.shuffle(group)
        evaluation_size = round(len(group) * 0.20)
        validation_size = round(len(group) * 0.20)
        splits["avaliacao"].extend(group[:evaluation_size])
        splits["validacao"].extend(group[evaluation_size:evaluation_size + validation_size])
        splits["treino"].extend(group[evaluation_size + validation_size:])

    for split, split_rows in splits.items():
        randomizer.shuffle(split_rows)
        for row in split_rows:
            row["split"] = split
    return splits


def json_response(label: str) -> str:
    return json.dumps({"sentimento": label}, ensure_ascii=False, separators=(",", ":"))


def to_alpaca(row: dict[str, Any]) -> dict[str, str]:
    return {"instruction": INSTRUCTION, "input": row["input"], "output": json_response(row["output_label"])}


def to_conversational(row: dict[str, Any]) -> dict[str, list[dict[str, str]]]:
    response = json_response(row["output_label"])
    return {
        "messages": [
            {
                "role": "system",
                "content": "Você classifica sentimentos em textos em português e responde somente com JSON válido.",
            },
            {"role": "user", "content": f"{INSTRUCTION}\n\nTexto: {row['input']}"},
            {"role": "assistant", "content": response},
        ]
    }


def validate_split(rows: list[dict[str, str]], split: str) -> dict[str, Any]:
    errors: list[dict[str, Any]] = []
    labels: Counter[str] = Counter()
    for index, row in enumerate(rows):
        try:
            if set(row) != {"instruction", "input", "output"}:
                raise ValueError("campos inválidos")
            parsed = json.loads(row["output"])
            if set(parsed) != {"sentimento"} or parsed["sentimento"] not in LABELS:
                raise ValueError("resposta JSON inválida")
            labels[parsed["sentimento"]] += 1
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            errors.append({"index": index, "error": str(error)})
    return {"split": split, "records": len(rows), "errors": errors, "labels": dict(sorted(labels.items()))}


def write_outputs(splits: dict[str, list[dict[str, Any]]], rejected: list[dict[str, Any]], lineage: list[dict[str, Any]], raw_rows: list[dict[str, str]]) -> dict[str, Any]:
    for directory in (WORK_DIR, PREPARED_DIR, REPORTS_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    target_names = {"treino": "train", "validacao": "validation", "avaliacao": "evaluation"}
    transformed: dict[str, list[dict[str, str]]] = {}
    for split, rows in splits.items():
        transformed[split] = [to_alpaca(row) for row in rows]
        stem = target_names[split]
        write_json(PREPARED_DIR / f"escutia_{stem}.json", transformed[split])
        write_json(PREPARED_DIR / f"escutia_{stem}_conversacional.json", [to_conversational(row) for row in rows])

    evaluation_rows = [{"id": index, **row, "split": "avaliacao"} for index, row in enumerate(transformed["avaliacao"], start=1)]
    write_jsonl(PREPARED_DIR / "avaliacao_congelada.jsonl", evaluation_rows)
    write_jsonl(WORK_DIR / "rejeitados.jsonl", rejected)
    write_jsonl(WORK_DIR / "linhagem.jsonl", lineage)

    dataset_info: dict[str, Any] = {}
    for split, stem in target_names.items():
        dataset_info[f"escutia_{split}"] = {
            "file_name": f"escutia_{stem}.json",
            "columns": {"prompt": "instruction", "query": "input", "response": "output"},
        }
        dataset_info[f"escutia_{split}_conversacional"] = {
            "file_name": f"escutia_{stem}_conversacional.json",
            "formatting": "sharegpt",
            "columns": {"messages": "messages"},
            "tags": {"role_tag": "role", "content_tag": "content", "user_tag": "user", "assistant_tag": "assistant", "system_tag": "system"},
        }
    write_json(PREPARED_DIR / "dataset_info.json", dataset_info)

    checks = [validate_split(rows, split) for split, rows in transformed.items()]
    source_hashes = {"dataset.csv": sha256_file(SOURCE_FILE), "dataset_local.csv": sha256_file(LOCAL_SOURCE_FILE)}
    final = {
        "passo": "dataset_json_estruturado",
        "decisao": "DATA_READY_FOR_SFT" if not any(check["errors"] for check in checks) else "DATA_BLOCKED",
        "objetivo": "Classificação de sentimento com resposta JSON estruturada.",
        "schema_resposta": {"sentimento": sorted(LABELS)},
        "counts": {"source": len(raw_rows), "prepared": sum(check["records"] for check in checks), "rejected": len(rejected), "splits": checks},
        "source_sha256": source_hashes,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "training_authorized": not any(check["errors"] for check in checks),
    }
    write_json(REPORTS_DIR / "01_origem.json", {"source": "dados/dataset.csv", "source_sha256": source_hashes})
    write_json(REPORTS_DIR / "02_schema.json", {"status": "PASS", "required_fields": ["id", "texto", "rotulo"]})
    write_json(REPORTS_DIR / "03_limpeza.json", {"status": "PASS", "transformations": ["NFKC", "espaços normalizados", "rótulos casefold"]})
    write_json(REPORTS_DIR / "04_duplicidades.json", {"status": "PASS", "rejected": len(rejected)})
    write_json(REPORTS_DIR / "05_divisao.json", {"status": "PASS", "seed": SEED, "stratified": True, "splits": checks})
    write_json(REPORTS_DIR / "06_formatos_llamafactory.json", {"status": "PASS", "dataset_info": "dados/preparados/dataset_info.json"})
    write_json(REPORTS_DIR / "11_validacao_final.json", final)
    write_json(ROOT / "manifesto_dataset.json", {"version": "2-json-sentimento", "source_sha256": source_hashes, "counts": final["counts"], "training_authorized": final["training_authorized"]})
    return final


def main() -> None:
    ensure_sources()
    ensure_output_is_empty()
    raw_rows = read_source()
    prepared, rejected, lineage = prepare_rows(raw_rows)
    splits = split_stratified(prepared)
    final = write_outputs(splits, rejected, lineage, raw_rows)
    print(json.dumps(final, ensure_ascii=False, indent=2))
    if final["decisao"] != "DATA_READY_FOR_SFT":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
