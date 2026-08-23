"""Baixa, valida e converte o dataset português para Alpaca SFT."""

from __future__ import annotations

import difflib
import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
REVISION = "606156db529f327fd871515cccbe14dcbafef682"
REPOSITORY = "cardiffnlp/tweet_sentiment_multilingual"
SOURCE_DIR = ROOT / "data" / "source"
DERIVED_DIR = ROOT / "data" / "derived"
INSTRUCTION = "Classifique o sentimento do texto em exatamente uma palavra: positivo, neutro ou negativo."
LABELS = {"0": "negativo", "1": "neutro", "2": "positivo"}
SPLITS = {
    "test": (97981, "274fa27f495b42485698b49775bfa07226dc6acc8795bc350ad367234905fee8"),
    "train": (207443, "95262fd2bf0e30657cf990ed9141aca8d9c0b0b18cdd35ef84b0488e2de9de09"),
    "validation": (35171, "906d1bd07d39e7bed4d5d22697986652c8a1b778a9107f1e62a31f81d7ade9ac"),
}
PT_MARKERS = {"a", "as", "ao", "com", "como", "da", "das", "de", "do", "dos", "e", "ela", "ele", "em", "eu", "foi", "isso", "mais", "mas", "me", "muito", "na", "não", "no", "nos", "o", "os", "ou", "para", "por", "que", "se", "sem", "ser", "sou", "tem", "uma", "um", "você", "vai", "já"}
NON_PT_MARKERS = {"about", "and", "are", "been", "but", "for", "from", "have", "hello", "how", "i", "is", "it", "not", "please", "the", "this", "was", "what", "with", "you", "el", "es", "hola", "los", "las", "una", "muy"}
TOKEN = re.compile(r"[\wÀ-ÿ]+", re.UNICODE)
HANDLE = re.compile(r"(?<![\w@])@[A-Za-z0-9_]{2,30}")
PHONE = re.compile(r"(?<!\d)(?:\+?\d[\d ()-]{7,}\d)(?!\d)")
EMAIL = re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")
SENSITIVE = {
    "profanity": re.compile(r"(?i)\b(?:buceta|caralho|cu|foda|fodase|merda|puta|puto|viado|vadia)\b"),
    "violence": re.compile(r"(?i)\b(?:matar|morte|morro|morr[ae]|assassinar|atirar|tiro|arma|bomb[ae])\b"),
    "hate_or_abuse": re.compile(r"(?i)\b(?:racista|racismo|nazista|terrorista|estupro|estuprar|homofob)\w*\b"),
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def normalize(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def is_portuguese(text: str) -> bool:
    tokens = [token.casefold() for token in TOKEN.findall(text)]
    pt = sum(token in PT_MARKERS for token in tokens)
    non_pt = sum(token in NON_PT_MARKERS for token in tokens)
    return not (non_pt >= 2 and non_pt > pt)


def near_duplicate(left: str, right: str) -> bool:
    left, right = normalize(left), normalize(right)
    if left == right or min(len(left), len(right)) < 12:
        return left == right
    if abs(len(left) - len(right)) > max(12, int(max(len(left), len(right)) * 0.2)):
        return False
    return difflib.SequenceMatcher(None, left, right, autojunk=False).ratio() >= 0.92


def download_sources() -> dict[str, list[dict]]:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    rows: dict[str, list[dict]] = {}
    for split, (expected_size, expected_hash) in SPLITS.items():
        target = SOURCE_DIR / f"{split}.jsonl"
        if not target.exists():
            url = f"https://huggingface.co/datasets/{REPOSITORY}/resolve/{REVISION}/data/portuguese/{split}.jsonl?download=true"
            request = Request(url, headers={"User-Agent": "EscutIA-treinamentoModelo/1.0"})
            with urlopen(request, timeout=120) as response:
                target.write_bytes(response.read())
        payload = target.read_bytes()
        if len(payload) != expected_size or sha256(payload) != expected_hash:
            raise SystemExit(f"Checksum ou tamanho inválido em {target}; apague o arquivo e tente novamente.")
        rows[split] = [json.loads(line) for line in payload.decode("utf-8").splitlines() if line.strip()]
    return rows


def prepare(rows_by_split: dict[str, list[dict]]) -> tuple[dict[str, list[dict]], Counter, dict, list[dict]]:
    candidates: list[dict] = []
    exclusions: Counter = Counter()
    for split, rows in rows_by_split.items():
        for index, record in enumerate(rows, start=1):
            text = record.get("text") if isinstance(record, dict) else None
            label = str(record.get("label")) if isinstance(record, dict) else ""
            if not isinstance(text, str) or not text.strip():
                exclusions["invalid_or_empty"] += 1
                continue
            if label not in LABELS:
                exclusions["invalid_label"] += 1
                continue
            reasons = []
            if len(text) > 280:
                reasons.append("over_280")
            if not is_portuguese(text):
                reasons.append("non_portuguese")
            if EMAIL.search(text):
                reasons.append("email_indicator")
            sensitive = [name for name, pattern in SENSITIVE.items() if pattern.search(text)]
            if sensitive:
                reasons.append("sensitive_content")
            if reasons:
                exclusions.update(reasons)
                continue
            redacted = PHONE.sub("<TELEFONE>", HANDLE.sub("<USUARIO>", text))
            candidates.append({"source_split": split, "source_index": index, "text": text, "input": redacted, "label": LABELS[label], "normalized": normalize(text), "normalized_input": normalize(redacted)})

    priority = {"test": 0, "validation": 1, "train": 2}
    kept: list[dict] = []
    for candidate in sorted(candidates, key=lambda item: (priority[item["source_split"]], item["source_index"])):
        conflict = next((other for other in kept if other["source_split"] != candidate["source_split"] and (other["normalized"] == candidate["normalized"] or other["normalized_input"] == candidate["normalized_input"] or near_duplicate(other["input"], candidate["input"]))), None)
        if conflict:
            exclusions["cross_split_duplicate"] += 1
            continue
        kept.append(candidate)

    derived = {"train": [], "validation": [], "frozen-test": []}
    lineage: list[dict] = []
    for item in kept:
        split = "frozen-test" if item["source_split"] == "test" else item["source_split"]
        record = {"instruction": INSTRUCTION, "input": item["input"], "output": item["label"]}
        derived[split].append(record)
        lineage.append({"source_split": item["source_split"], "source_index": item["source_index"], "derived_split": split, "derived_index": len(derived[split]), "source_text_sha256": sha256(item["text"].encode("utf-8")), "derived_record_sha256": sha256(json.dumps(record, ensure_ascii=False, sort_keys=True).encode("utf-8"))})
    observations = {split: {label: sum(row["output"] == label for row in records) for label in LABELS.values()} for split, records in derived.items()}
    return derived, exclusions, observations, lineage


def main() -> int:
    if DERIVED_DIR.exists():
        raise SystemExit(f"A saída já existe: {DERIVED_DIR}. Preserve-a e escolha uma nova transformação para repetir.")
    rows = download_sources()
    derived, exclusions, counts, lineage = prepare(rows)
    DERIVED_DIR.mkdir(parents=True, exist_ok=False)
    for split, records in derived.items():
        (DERIVED_DIR / f"{split}.jsonl").write_text("".join(json.dumps(record, ensure_ascii=False) + "\n" for record in records), encoding="utf-8")
    (DERIVED_DIR / "lineage.jsonl").write_text("".join(json.dumps(record, ensure_ascii=False) + "\n" for record in lineage), encoding="utf-8")
    (DERIVED_DIR / "dataset_info.json").write_text(json.dumps({split: {"file_name": f"{split}.jsonl", "formatting": "alpaca"} for split in derived}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest = {"repository": REPOSITORY, "revision": REVISION, "transformation": "transformation-v1", "counts": {split: len(records) for split, records in derived.items()}, "class_counts": counts, "exclusions": dict(sorted(exclusions.items())), "source_dir": str(SOURCE_DIR), "derived_dir": str(DERIVED_DIR)}
    (DERIVED_DIR / "dataset-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
