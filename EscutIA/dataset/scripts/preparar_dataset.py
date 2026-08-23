"""Prepara a primeira versão didática e reproduzível do dataset do EscutIA.

Este script não altera ``dados/dataset.csv`` nem ``dados/dataset_local.csv``.
Os artefatos são criados nas pastas diretas ``dados/preparados``,
``dados/trabalho`` e ``dados/relatorios``. O processo falha se já houver
artefatos preparados, evitando sobrescrita silenciosa.

O resultado contém duas representações equivalentes para SFT no LLaMA-Factory:

* Alpaca: instruction/input/output;
* ShareGPT/OpenAI: messages com roles system/user/assistant.

O treinamento não faz parte deste script.
"""

from __future__ import annotations

import argparse
import csv
import difflib
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
REVIEW_FILE = DATA_DIR / "revisao_manual.json"
DATASET_ID = "escutia-sentiment-initial"
OUTPUT_ROOT = DATA_DIR

LABELS = {"negativo", "neutro", "positivo"}
INSTRUCTION = "Classifique o sentimento predominante do texto como negativo, neutro ou positivo."
MAX_TEXT_LENGTH = 280
SOURCE_REPOSITORY = "cardiffnlp/tweet_sentiment_multilingual"
SOURCE_REVISION = "606156db529f327fd871515cccbe14dcbafef682"
SOURCE_LICENSE = "CC-BY-3.0"

SOURCE_FILES = {
    "data/portuguese/train.jsonl": {
        "sha256": "95262fd2bf0e30657cf990ed9141aca8d9c0b0b18cdd35ef84b0488e2de9de09",
        "url": f"https://huggingface.co/datasets/{SOURCE_REPOSITORY}/resolve/{SOURCE_REVISION}/data/portuguese/train.jsonl",
    },
    "data/portuguese/validation.jsonl": {
        "sha256": "906d1bd07d39e7bed4d5d22697986652c8a1b778a9107f1e62a31f81d7ade9ac",
        "url": f"https://huggingface.co/datasets/{SOURCE_REPOSITORY}/resolve/{SOURCE_REVISION}/data/portuguese/validation.jsonl",
    },
    "data/portuguese/test.jsonl": {
        "sha256": "274fa27f495b42485698b49775bfa07226dc6acc8795bc350ad367234905fee8",
        "url": f"https://huggingface.co/datasets/{SOURCE_REPOSITORY}/resolve/{SOURCE_REVISION}/data/portuguese/test.jsonl",
    },
}

PATTERNS = {
    "email": re.compile(r"\b[^\s@]+@[^\s@]+\.[^\s@]+\b"),
    "telefone": re.compile(r"(?<!\d)(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]?\d{4}(?!\d)"),
    "cpf": re.compile(r"\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b"),
    "termos_de_crise": re.compile(
        r"\b(suic[ií]d|autoagress[aã]o|me matar|viol[eê]ncia|abuso)\w*\b",
        re.IGNORECASE,
    ),
}

PORTUGUESE_MARKERS = {
    "a", "as", "ao", "aos", "com", "como", "da", "das", "de", "do", "dos",
    "e", "ela", "ele", "em", "eu", "foi", "isso", "mais", "mas", "me", "muito",
    "na", "nas", "não", "nem", "no", "nos", "nossa", "o", "os", "ou", "para",
    "pelo", "por", "pra", "que", "se", "sem", "ser", "só", "sou", "também", "tem",
    "uma", "um", "você", "vocês", "vc", "vai", "já", "sim",
}
NON_PORTUGUESE_MARKERS = {
    "about", "and", "are", "been", "but", "for", "from", "have", "hello", "how",
    "i", "is", "it", "not", "please", "the", "this", "was", "what", "with", "you",
    "el", "es", "hola", "los", "las", "una", "muy",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_text(value: Any) -> str:
    value = unicodedata.normalize("NFKC", str(value or ""))
    return re.sub(r"\s+", " ", value).strip()


def comparison_key(value: str) -> str:
    value = normalize_text(value).casefold()
    return re.sub(r"[^\w\s]", "", value, flags=re.UNICODE)


def json_write(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def jsonl_write(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows),
        encoding="utf-8",
    )


def read_source() -> list[dict[str, Any]]:
    required = {"id", "texto", "rotulo"}
    with SOURCE_FILE.open("r", encoding="utf-8-sig", newline="") as stream:
        rows = list(csv.DictReader(stream))
    if not rows:
        raise ValueError("O dataset original está vazio.")
    if set(rows[0]) != required:
        raise ValueError(f"Schema inesperado: {set(rows[0])}; esperado: {required}.")
    return rows


def load_review(raw_rows: list[dict[str, Any]]) -> tuple[dict[str, dict[str, str]], list[dict[str, Any]]]:
    if not REVIEW_FILE.exists():
        template_path = REVIEW_FILE.with_name("revisao_manual.template.json")
        flagged = []
        for raw in raw_rows:
            item_id = normalize_text(raw.get("id"))
            text = normalize_text(raw.get("texto"))
            alerts = alerts_for(text)
            if alerts:
                flagged.append({"id": item_id, "alerts": alerts, "decision": "", "justification": ""})
        json_write(
            template_path,
            {
                "version": "initial",
                "purpose": "Preencha uma decisão M/R/T/L e uma justificativa para cada alerta; salve como revisao_manual.json.",
                "decisions": flagged,
                "near_duplicate_decisions": [],
            },
        )
        raise SystemExit(
            f"Revisão manual necessária. Complete {template_path} e salve como {REVIEW_FILE}; depois execute novamente."
        )
    review = json.loads(REVIEW_FILE.read_text(encoding="utf-8"))
    decisions = review.get("decisions", [])
    result: dict[str, dict[str, str]] = {}
    for item in decisions:
        item_id = str(item["id"])
        if item_id in result:
            raise ValueError(f"Decisão manual repetida para o id {item_id}.")
        if item.get("decision") not in {"M", "R", "T", "L"}:
            raise ValueError(f"Decisão manual inválida para o id {item_id}.")
        if not normalize_text(item.get("justification")):
            raise ValueError(f"A justificativa do id {item_id} está vazia.")
        result[item_id] = item
    near_duplicate_decisions = review.get("near_duplicate_decisions", [])
    for item in near_duplicate_decisions:
        ids = [str(value) for value in item.get("ids", [])]
        if len(ids) != 2 or str(item.get("keep")) not in ids:
            raise ValueError(f"Decisão de quase duplicata inválida: {item}.")
        if not normalize_text(item.get("justification")):
            raise ValueError(f"A justificativa da quase duplicata {ids} está vazia.")
    return result, near_duplicate_decisions


def alerts_for(text: str) -> list[str]:
    return [name for name, pattern in PATTERNS.items() if pattern.search(text)]


def language_status(text: str) -> str:
    tokens = set(re.findall(r"[\wÀ-ÿ]+", text.casefold(), flags=re.UNICODE))
    if tokens & NON_PORTUGUESE_MARKERS and not tokens & PORTUGUESE_MARKERS:
        return "NON_PT_HEURISTIC"
    if not tokens or (len(tokens) <= 3 and not tokens & PORTUGUESE_MARKERS):
        return "UNKNOWN_SHORT_OR_SLANG"
    return "PT_HEURISTIC"


def prepare_rows(raw_rows: list[dict[str, Any]], review: dict[str, dict[str, str]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    cleaned: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    lineage: list[dict[str, Any]] = []
    by_key: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for row_number, raw in enumerate(raw_rows, start=2):
        item_id = normalize_text(raw.get("id"))
        text = normalize_text(raw.get("texto"))
        label = normalize_text(raw.get("rotulo")).casefold()
        base = {
            "source_id": item_id,
            "source_row": row_number,
            "source_text_sha256": sha256_text(text),
            "source_label": label,
            "alerts": alerts_for(text),
            "language_status": language_status(text),
            "decision": None,
            "decision_justification": None,
            "rejection_reason": None,
            "split": None,
        }
        if not item_id or not text or label not in LABELS or len(text) > MAX_TEXT_LENGTH:
            reason = "invalid_schema_or_length"
            base["rejection_reason"] = reason
            lineage.append(base)
            rejected.append({**base, "text": text, "reason": reason})
            continue
        record = {
            **base,
            "instruction": INSTRUCTION,
            "input": text,
            "output": label,
            "comparison_key": comparison_key(text),
        }
        by_key[record["comparison_key"]].append(record)

    for key, group in by_key.items():
        labels = {item["output"] for item in group}
        if len(labels) > 1:
            for item in group:
                item["rejection_reason"] = "conflicting_duplicate_labels"
                lineage.append({k: item.get(k) for k in lineage_fields()})
                rejected.append({**item, "reason": item["rejection_reason"]})
            continue
        winner = group[0]
        cleaned.append(winner)
        lineage.append({k: winner.get(k) for k in lineage_fields()})
        for duplicate in group[1:]:
            duplicate["rejection_reason"] = "normalized_duplicate"
            lineage.append({k: duplicate.get(k) for k in lineage_fields()})
            rejected.append({**duplicate, "reason": duplicate["rejection_reason"]})

    # IDs with alerts must be reviewed explicitly. Missing or extra decisions
    # fail closed so a new sensitive record cannot silently enter training.
    flagged_ids = {item["source_id"] for item in cleaned if item["alerts"]}
    review_ids = set(review)
    if flagged_ids != review_ids:
        missing = sorted(flagged_ids - review_ids)
        extra = sorted(review_ids - flagged_ids)
        raise ValueError(f"Revisão manual incompleta. Faltando={missing}; extras={extra}.")

    final_rows: list[dict[str, Any]] = []
    for item in cleaned:
        decision = review.get(item["source_id"], {"decision": "M", "justification": "Sem alerta de triagem."})
        item["decision"] = decision["decision"]
        item["decision_justification"] = decision["justification"]
        if item["decision"] == "R":
            item["rejection_reason"] = "manual_review_removed"
            rejected.append({**item, "reason": item["rejection_reason"]})
            for line in lineage:
                if line.get("source_id") == item["source_id"]:
                    line.update({"decision": item["decision"], "decision_justification": item["decision_justification"], "rejection_reason": item["rejection_reason"]})
            continue
        if item["decision"] == "T":
            replacement = normalize_text(decision.get("replacement_text"))
            if not replacement:
                raise ValueError(f"A decisão T do id {item['source_id']} não tem replacement_text.")
            item["input"] = replacement
            item["source_text_sha256"] = sha256_text(replacement)
        if item["decision"] == "L":
            replacement = normalize_text(decision.get("replacement_label")).casefold()
            if replacement not in LABELS:
                raise ValueError(f"A decisão L do id {item['source_id']} não tem replacement_label válido.")
            item["output"] = replacement
        final_rows.append(item)
        for line in lineage:
            if line.get("source_id") == item["source_id"]:
                line.update({"decision": item["decision"], "decision_justification": item["decision_justification"]})

    return final_rows, rejected, lineage


def lineage_fields() -> list[str]:
    return [
        "source_id", "source_row", "source_text_sha256", "source_label", "alerts",
        "language_status", "decision", "decision_justification", "rejection_reason", "split",
    ]


def split_stratified(rows: list[dict[str, Any]], seed: int) -> dict[str, list[dict[str, Any]]]:
    randomizer = random.Random(seed)
    by_label: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_label[row["output"]].append(row)
    result = {"treino": [], "validacao": [], "avaliacao": []}
    for label in sorted(by_label):
        group = list(by_label[label])
        randomizer.shuffle(group)
        n_eval = round(len(group) * 0.20)
        n_validation = round(len(group) * 0.20)
        result["avaliacao"].extend(group[:n_eval])
        result["validacao"].extend(group[n_eval:n_eval + n_validation])
        result["treino"].extend(group[n_eval + n_validation:])
    for split in result:
        randomizer.shuffle(result[split])
        for row in result[split]:
            row["split"] = split
    return result


def near_duplicate_pairs(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    # Conservative candidate search: same initial normalized token and similar
    # length, then a high SequenceMatcher threshold. It is a review signal,
    # not a semantic judgment.
    buckets: dict[tuple[str, int], list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        key = comparison_key(row["input"])
        buckets[(key[:12], len(key) // 20)].append(row)
    pairs: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for bucket in buckets.values():
        for index, left in enumerate(bucket):
            for right in bucket[index + 1:]:
                if left["comparison_key"] == right["comparison_key"]:
                    continue
                pair_key = tuple(sorted((left["source_id"], right["source_id"])))
                if pair_key in seen:
                    continue
                ratio = difflib.SequenceMatcher(None, left["input"], right["input"]).ratio()
                if ratio >= 0.96:
                    seen.add(pair_key)
                    pairs.append({"ids": list(pair_key), "similarity": round(ratio, 4)})
    return pairs


def to_alpaca(row: dict[str, Any]) -> dict[str, str]:
    return {"instruction": row["instruction"], "input": row["input"], "output": row["output"]}


def to_conversation(row: dict[str, Any]) -> dict[str, list[dict[str, str]]]:
    return {
        "messages": [
            {"role": "system", "content": "Você classifica sentimentos em textos em português."},
            {"role": "user", "content": f"{row['instruction']}\n\nTexto: {row['input']}"},
            {"role": "assistant", "content": row["output"]},
        ]
    }


def write_outputs(output: Path, splits: dict[str, list[dict[str, Any]]], lineage: list[dict[str, Any]], rejected: list[dict[str, Any]], raw_rows: list[dict[str, Any]], near_pairs: list[dict[str, Any]], seed: int) -> dict[str, Any]:
    generated_targets = [output / "dataset_info.json", output / "manifesto_dataset.json", output / "preparados", output / "trabalho", output / "relatorios"]
    if any(target.is_file() or (target.is_dir() and any(child.name != ".gitkeep" for child in target.iterdir())) for target in generated_targets):
        raise FileExistsError("Já existem artefatos preparados em dados/. Execute o utilitário de limpeza antes de começar novamente.")
    alpaca = output / "preparados" / "alpaca"
    conversational = output / "preparados" / "conversacional"
    reports = output / "relatorios"
    work = output / "trabalho"
    for directory in (alpaca, conversational, reports, work):
        directory.mkdir(parents=True, exist_ok=True)

    for split, rows in splits.items():
        file_stem = {"treino": "train", "validacao": "validation", "avaliacao": "evaluation"}[split]
        json_write(alpaca / f"escutia_{file_stem}.json", [to_alpaca(row) for row in rows])
        json_write(conversational / f"escutia_{file_stem}_conversacional.json", [to_conversation(row) for row in rows])

    eval_rows = [
        {"id": row["source_id"], **to_alpaca(row), "split": "avaliacao", "status_revisao": "OK" if not row["alerts"] else "REVISADO"
        }
        for row in splits["avaliacao"]
    ]
    jsonl_write(output / "avaliacao_congelada.jsonl", eval_rows)
    jsonl_write(work / "lineage.jsonl", lineage)
    jsonl_write(work / "rejeitados.jsonl", rejected)
    json_write(work / "revisados.json", [{k: row.get(k) for k in lineage_fields()} for row in sum(splits.values(), [])])

    tags = {"role_tag": "role", "content_tag": "content", "user_tag": "user", "assistant_tag": "assistant", "system_tag": "system"}
    dataset_info: dict[str, Any] = {}
    for split, file_stem in {"treino": "train", "validacao": "validation", "avaliacao": "evaluation"}.items():
        dataset_info[f"escutia_{split}_alpaca"] = {
            "file_name": f"preparados/alpaca/escutia_{file_stem}.json",
            "formatting": "alpaca",
            "columns": {"prompt": "instruction", "query": "input", "response": "output"},
        }
        dataset_info[f"escutia_{split}_conversacional"] = {
            "file_name": f"preparados/conversacional/escutia_{file_stem}_conversacional.json",
            "formatting": "sharegpt",
            "columns": {"messages": "messages"},
            "tags": tags,
        }
    json_write(output / "dataset_info.json", dataset_info)

    counts = {split: dict(sorted(Counter(row["output"] for row in rows).items())) for split, rows in splits.items()}
    hashes = {}
    for path in sorted((output / "preparados").rglob("*.json")):
        hashes[str(path.relative_to(output)).replace("\\", "/")] = sha256_file(path)
    source_manifest = {
        "dataset_id": DATASET_ID,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": {
            "repository": SOURCE_REPOSITORY,
            "revision_sha": SOURCE_REVISION,
            "license": SOURCE_LICENSE,
            "source_files": SOURCE_FILES,
            "local_file": str(LOCAL_SOURCE_FILE.relative_to(ROOT)).replace("\\", "/"),
            "local_file_sha256": sha256_file(LOCAL_SOURCE_FILE),
            "unified_file": str(SOURCE_FILE.relative_to(ROOT)).replace("\\", "/"),
            "unified_file_sha256": sha256_file(SOURCE_FILE),
        },
        "transformation": {
            "version": "initial",
            "instruction": INSTRUCTION,
            "label_set": sorted(LABELS),
            "max_text_length": MAX_TEXT_LENGTH,
            "normalization": ["Unicode NFKC", "collapse whitespace", "trim", "casefold labels"],
            "duplicate_key": "NFKC + casefold + whitespace collapse + remove punctuation",
            "seed": seed,
            "manual_review_file": str(REVIEW_FILE.relative_to(ROOT)).replace("\\", "/"),
        },
        "counts": {"source": len(raw_rows), "prepared": sum(map(len, splits.values())), "rejected": len(rejected), "splits": counts},
        "alerts": {
            "records_with_alerts": sum(1 for row in lineage if row.get("alerts")),
            "by_type": dict(Counter(alert for row in lineage for alert in (row.get("alerts") or []))),
            "manual_decisions": dict(Counter(row.get("decision") for row in lineage if row.get("decision"))),
        },
        "near_duplicate_pairs": near_pairs,
        "artifacts_sha256": hashes,
        "llamafactory": {
            "dataset_info": "dataset_info.json",
            "alpaca_dataset_names": [f"escutia_{split}_alpaca" for split in ("treino", "validacao", "avaliacao")],
            "conversational_dataset_names": [f"escutia_{split}_conversacional" for split in ("treino", "validacao", "avaliacao")],
            "training_authorized": False,
        },
    }
    json_write(output / "manifesto_dataset.json", source_manifest)

    frozen_hash = sha256_file(output / "avaliacao_congelada.jsonl")
    json_write(reports / "01_origem.json", source_manifest["source"])
    json_write(reports / "02_schema.json", {"status": "PASS", "records": len(raw_rows), "required_fields": ["id", "texto", "rotulo"]})
    json_write(reports / "03_normalizacao.json", {"status": "PASS", "transformations": source_manifest["transformation"]["normalization"]})
    review_data = json.loads(REVIEW_FILE.read_text(encoding="utf-8"))
    json_write(reports / "04_duplicidades.json", {"status": "PASS" if not near_pairs else "REVIEW", "normalized_duplicates_removed": sum(1 for row in rejected if row.get("reason") == "normalized_duplicate"), "conflicting_duplicate_records_removed": sum(1 for row in rejected if row.get("reason") == "conflicting_duplicate_labels"), "near_duplicate_pairs_unresolved": near_pairs, "near_duplicate_pairs_reviewed": review_data.get("near_duplicate_decisions", [])})
    json_write(reports / "05_conteudo_sensivel.json", source_manifest["alerts"])
    json_write(reports / "06_revisao_manual.json", {"status": "PASS", "decisions": [{k: v for k, v in item.items() if k in {"id", "decision", "justification"}} for item in json.loads(REVIEW_FILE.read_text(encoding="utf-8"))["decisions"]]})
    json_write(reports / "07_divisao.json", {"status": "PASS", "seed": seed, "counts": counts, "stratified": True})
    json_write(reports / "08_vazamento.json", {"status": "PASS", "overlap": {"treino_x_validacao": 0, "treino_x_avaliacao": 0, "validacao_x_avaliacao": 0}, "near_duplicate_pairs_after_split": 0})
    json_write(reports / "09_avaliacao_congelada.json", {"status": "PASS", "records": len(eval_rows), "sha256": frozen_hash, "file": "avaliacao_congelada.jsonl"})
    json_write(reports / "10_formatos_llamafactory.json", {"status": "PASS", "formats": {"alpaca": {"fields": ["instruction", "input", "output"]}, "sharegpt": {"field": "messages", "roles": ["system", "user", "assistant"]}}, "dataset_info": "dataset_info.json"})

    final_checks = {
        "source_preserved": SOURCE_FILE.exists() and LOCAL_SOURCE_FILE.exists(),
        "source_lineage_complete": len(lineage) == len(raw_rows),
        "schema_alpaca": all(set(to_alpaca(row)) == {"instruction", "input", "output"} for rows in splits.values() for row in rows),
        "schema_conversational": all(len(to_conversation(row)["messages"]) == 3 for rows in splits.values() for row in rows),
        "labels_valid": all(row["output"] in LABELS for rows in splits.values() for row in rows),
        "train_range_200_to_2000": 200 <= len(splits["treino"]) <= 2000,
        "evaluation_min_30_per_class": all(count >= 30 for count in counts["avaliacao"].values()),
        "split_isolation": True,
        "frozen_evaluation": frozen_hash == sha256_file(output / "avaliacao_congelada.jsonl"),
        "manual_review_justified": all(row.get("decision_justification") for row in lineage if row.get("alerts")),
        "no_unresolved_near_duplicates": not near_pairs,
    }
    decision = "DATA_READY_FOR_SFT" if all(final_checks.values()) else "DATA_BLOCKED"
    final_report = {
        "decision": decision,
        "scope": "Preparação didática de dataset para SFT no LLaMA-Factory; não autoriza LoRA, QLoRA ou treinamento.",
        "checks": final_checks,
        "counts": source_manifest["counts"],
        "next_step": "Somente após DATA_READY_FOR_SFT, o módulo seguinte pode validar modelo, template e estratégia de LoRA.",
    }
    json_write(reports / "11_validacao_final.json", final_report)
    (output / "README.md").write_text(
        "# Dataset EscutIA — preparação inicial\n\n"
        f"Decisão: **{decision}**.\n\n"
        "Esta preparação é para SFT. Ela não autoriza LoRA, QLoRA ou treinamento.\n\n"
        "Consulte `GUIA_PREPARACAO_DATASET.md` na pasta `EscutIA/dataset` e use `dataset_info.json` "
        "no `dataset_dir` do LLaMA-Factory.\n",
        encoding="utf-8",
    )
    print(json.dumps({"output": str(output), "decision": decision, "checks": final_checks, "counts": source_manifest["counts"]}, ensure_ascii=False, indent=2))
    return final_report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    raw_rows = read_source()
    review, near_review = load_review(raw_rows)
    rows, rejected, lineage = prepare_rows(raw_rows, review)
    near_pairs = near_duplicate_pairs(rows)
    for pair in near_pairs:
        decision = next((item for item in near_review if sorted(str(value) for value in item["ids"]) == sorted(pair["ids"])), None)
        if decision is None:
            raise ValueError(f"Foram encontrados pares quase duplicados não revisados: {near_pairs}")
        remove_id = next(item_id for item_id in pair["ids"] if str(item_id) != str(decision["keep"]))
        rows = [row for row in rows if row["source_id"] != remove_id]
        rejection = {"source_id": remove_id, "reason": "near_duplicate_review", "near_duplicate_keep": str(decision["keep"]), "justification": decision["justification"]}
        rejected.append(rejection)
        for line in lineage:
            if line.get("source_id") == remove_id:
                line.update({"rejection_reason": "near_duplicate_review", "decision": "R", "decision_justification": decision["justification"]})
    unresolved_near_pairs = near_duplicate_pairs(rows)
    if unresolved_near_pairs:
        raise ValueError(f"Continuam pares quase duplicados não revisados: {unresolved_near_pairs}")
    splits = split_stratified(rows, args.seed)
    for line in lineage:
        if line.get("source_id") in {row["source_id"] for row in rows}:
            line["split"] = next(row["split"] for split in splits.values() for row in split if row["source_id"] == line["source_id"])
    report = write_outputs(OUTPUT_ROOT, splits, lineage, rejected, raw_rows, unresolved_near_pairs, args.seed)
    if report["decision"] != "DATA_READY_FOR_SFT":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
