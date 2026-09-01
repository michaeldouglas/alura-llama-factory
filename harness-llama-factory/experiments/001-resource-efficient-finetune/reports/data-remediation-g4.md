# G4 remediation — derived dataset review

**Decision: `DERIVED_CANDIDATE_READY`**

This is a remediation report for an existing G4 `DATA_BLOCKED` result. It does not change or replace the original G4 report, and it does not declare the original G4 result `DATA_READY`. Training remains blocked until a later review accepts this derived candidate and all subsequent gates.

## Scope and authorization

- Owner approval: `2026-08-22` (`experiment owner`), gate `G4-REMEDIATION`.
- Source: `cardiffnlp/tweet_sentiment_multilingual` revision `606156db529f327fd871515cccbe14dcbafef682`, configuration `portuguese`.
- Original G4 decision: `DATA_BLOCKED`.
- External output: `%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/data-derived/cardiffnlp--tweet_sentiment_multilingual/606156db529f327fd871515cccbe14dcbafef682/transformation-v1`.
- Transformation: `transformation-v1`; UTF-8 JSONL Alpaca SFT.
- The source was read-only and its pinned file hashes were rechecked. No source file was modified.

## Transformation criteria

- Fixed instruction: `Classifique o sentimento do texto em exatamente uma palavra: positivo, neutro ou negativo.`.
- `input` is source `text`; `output` maps `0=negativo`, `1=neutro`, `2=positivo`.
- Handles are redacted as `<USUARIO>` and telephone numbers as `<TELEFONE>`.
- Records with a sensitive indicator, `NON_PT_HEURISTIC`, invalid structure, empty text, over-280 text, or unredacted PII are excluded with a lineage reason.
- Exact, normalized and near duplicates are resolved across splits with priority `frozen-test > validation > train`.

## Counts before and after

- Source records seen: **3033**.
- Source counts by split: `{"test": 870, "train": 1839, "validation": 324}`.
- Candidate counts after policy exclusions: `{"frozen-test": 854, "train": 1797, "validation": 314}`.
- Derived counts: `{"frozen-test": 854, "train": 1792, "validation": 314}`.
- Derived class counts: `{"frozen-test": {"negativo": 279, "neutro": 289, "positivo": 286}, "train": {"negativo": 586, "neutro": 603, "positivo": 603}, "validation": {"negativo": 104, "neutro": 105, "positivo": 105}}`.
- Exclusions by reason: `{"NON_PT_HEURISTIC": 1, "duplicate_near": 3, "duplicate_normalized": 2, "sensitive_indicator:hate_or_abuse": 10, "sensitive_indicator:profanity": 37, "sensitive_indicator:violence": 20}`.

## Redactions

- Retained records with handle redactions: `556`; occurrences: `730`.
- Retained records with phone redactions: `1`; occurrences: `1`.

## Duplicate resolution

- Cross-split duplicate observations before resolution: `{"exact_pairs_total": 0, "near_duplicate_pairs_total": 3, "normalized_pairs_total": 2, "pairs": {"test__train": {"exact_text_overlap": 0, "near_duplicate_pairs": 2, "normalized_text_overlap": 1}, "test__validation": {"exact_text_overlap": 0, "near_duplicate_pairs": 0, "normalized_text_overlap": 0}, "train__validation": {"exact_text_overlap": 0, "near_duplicate_pairs": 1, "normalized_text_overlap": 1}}}`.
- Lower-priority exclusions: `{"duplicate_near": 3, "duplicate_normalized": 2}`.
- The frozen test output is isolated from validation and training by the recorded duplicate policy and post-transform schema check.

## Validation and decision

- Derived schema validation: `{"class_counts": {"frozen-test": {"negativo": 279, "neutro": 289, "positivo": 286}, "train": {"negativo": 586, "neutro": 603, "positivo": 603}, "validation": {"negativo": 104, "neutro": 105, "positivo": 105}}, "cross_split": {"frozen-test__train": {"exact_or_normalized_overlap": 0, "near_duplicate_pairs": 0}, "frozen-test__validation": {"exact_or_normalized_overlap": 0, "near_duplicate_pairs": 0}, "train__validation": {"exact_or_normalized_overlap": 0, "near_duplicate_pairs": 0}}, "errors": {}, "valid": true}`.
- Artifact metadata is recorded in `experiments/001-resource-efficient-finetune/manifests/dataset-info.json`; data and lineage remain external.
- Candidate criteria: training count 200–2,000; at least 30 examples per class in frozen-test; no post-transform cross-split exact/normalized/near duplicate; valid Alpaca schema.
- Training authorization: `BLOCKED`.

## Limits

- Language and sensitive-content detection are conservative heuristics; they are not semantic or legal determinations.
- Redaction is limited to handles and telephone patterns authorized by this transformation; no missing data is invented.
- This artifact is a derived candidate, not a replacement for owner/orchestrator review of license, privacy, schema, runtime and execution gates.
- No source text, examples, or model/training artifacts are included in this repository report.
