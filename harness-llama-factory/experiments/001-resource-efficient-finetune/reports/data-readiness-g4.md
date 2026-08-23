# G4 — Data readiness report

**Decision: `DATA_BLOCKED`**

This report contains aggregate validation findings only. The approved source remained outside the repository, read-only, and unchanged; no derived dataset or source-text copy was created.

## Source identity

- Repository: `cardiffnlp/tweet_sentiment_multilingual`
- Revision: `606156db529f327fd871515cccbe14dcbafef682`
- Configuration: `portuguese`
- External cache: `C:\Users\mdbaa\AppData\Local\alura-llama-factory\001-resource-efficient-finetune\cache\dataset-source\cardiffnlp--tweet_sentiment_multilingual\606156db529f327fd871515cccbe14dcbafef682`
- License: `CC-BY-3.0`; G3 terms acceptance remains the governing authorization.

## Quantified findings

- Records analyzed: **3033**
- Counts by split: `{"test": 870, "train": 1839, "validation": 324}`
- Counts by label: `{"negativo": 1011, "neutro": 1011, "positivo": 1011}`
- Label map: `0=negativo`, `1=neutro`, `2=positivo`
- Split/class counts: `{"test": {"negativo": 290, "neutro": 290, "positivo": 290}, "train": {"negativo": 613, "neutro": 613, "positivo": 613}, "validation": {"negativo": 108, "neutro": 108, "positivo": 108}}`
- Unicode length summary: `{"test": {"max": 141, "mean": 72.522, "min": 19, "over_280": 0}, "train": {"max": 146, "mean": 73.823, "min": 18, "over_280": 0}, "validation": {"max": 140, "mean": 70.435, "min": 19, "over_280": 0}}`
- Language heuristic: `{"counts": {"NON_PT_HEURISTIC": 1, "PT_HEURISTIC": 2789, "UNKNOWN_SHORT_OR_SLANG": 243}, "method": "conservative token-marker heuristic; unknown short/slang text is not classified as non-Portuguese"}`
- Duplicate isolation: `{"test__train": {"exact_text_overlap": 0, "near_duplicate_pairs": 2, "normalized_text_overlap": 1}, "test__validation": {"exact_text_overlap": 0, "near_duplicate_pairs": 0, "normalized_text_overlap": 0}, "train__validation": {"exact_text_overlap": 0, "near_duplicate_pairs": 1, "normalized_text_overlap": 1}}`; near-duplicate pairs total `3`
- Privacy indicators: `{"direct_pii_records_by_category": {"phone": 1}, "note": "URLs and handles are reported separately; no source text is emitted.", "records_with_social_handles": 561, "records_with_urls": 0}`
- Sensitive-content indicators: `{"method": "conservative keyword indicators requiring review; no source text is emitted.", "records_by_category": {"hate_or_abuse": 10, "profanity": 37, "violence": 20}}`

## Decision basis

The dataset is blocked for the following quantified or policy reasons:
- `cross_split_exact_or_normalized_overlap`
- `cross_split_near_duplicates`
- `non_portuguese_heuristic_records`
- `direct_pii_indicators`
- `sensitive_content_indicators`

## Dataset-specialist review

Formal aggregate review confirms the decision: **`DATA_BLOCKED` is sustained**. The split counts sum to **3,033** (`1,839/324/870`) and the three labels are balanced (**1,011 each**). The evidence records **3 cross-split near-duplicate pairs** and, separately, **2 normalized-overlap matches**; it also records **1 phone indicator**, **67 sensitive-content indicators** and **1 non-Portuguese heuristic finding**. The validator is syntactically valid, and no material correction to `validate_dataset.py` or `dataset-validation-g4.json` is required. No source or derived data was changed or created during this review.

If a future reviewed result becomes `DATA_READY`, that would mean the immutable source passed G4 validation. The current `DATA_BLOCKED` result does not authorize preparation, conversion, filtering, model loading, inference, or training. Any future derived record must preserve source lineage and be written outside the repository.

## Reproducibility and limitations

- Validation rechecked the approved SHA-256 hashes before reading JSONL records.
- Text length is measured as Unicode code points, with the specification limit of 280.
- Language and sensitive-content checks are conservative heuristics and do not replace human review when a finding is present.
- No raw text, examples, or row-level identifiers are included in this report.
