# G4-DERIVED — Data readiness decision

**Decision: `DATA_READY` for the derived candidate only**

The `dataset-specialist` preparation evidence in `reports/data-remediation-g4.md` was reviewed and registered by the orchestrator. This decision applies to the separately identified `transformation-v1` derivative; it does not replace the original source decision, which remains `DATA_BLOCKED` in `reports/data-readiness-g4.md`.

## Identity and storage

- Dataset: `cardiffnlp/tweet_sentiment_multilingual`
- Source revision: `606156db529f327fd871515cccbe14dcbafef682`
- Configuration: `portuguese`
- Transformation: `transformation-v1`
- Derived data: external `%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/data-derived/.../transformation-v1/`
- Metadata: `manifests/dataset-info.json`
- Source license and G3 terms: unchanged; CC BY 3.0 and applicable X/Twitter restrictions remain in force.

## Readiness evidence

- Train: **1.792** records.
- Validation: **314** records.
- Frozen-test: **854** records.
- Class counts remain present and balanced enough for the planned first experiment.
- Alpaca schema validation: **PASS**.
- Cross-split exact, normalized and near-duplicate isolation: **PASS** after the documented transformation.
- Lineage: **3.033** source rows represented, including retained and excluded rows with reasons.
- External artifact hashes: **PASS**.
- Original source hashes and read-only state: **PASS**.
- Repository contains no derived JSONL, weights or source text.

## Decision boundary

`DATA_READY` authorizes only the next dataset-dependent review: strategy, model compatibility and resource estimation. It does not authorize model loading, inference, baseline, dry validation or training. Those actions require their own gates and explicit owner authorization.

The original G4 source decision remains `DATA_BLOCKED`; the ready object is the derived candidate identified by `dataset-info.json` and `g4-derived.json`.
