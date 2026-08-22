# Resource-Efficient First Fine-Tuning Experiment

This directory contains only versioned governance, validation code, manifests, configuration proposals and reports for feature `001-resource-efficient-finetune` on repository branch `feature/harness-completo`.

## Current authorization

- G0: requirements approved.
- G0-B: plan and provisional Qwen/Cardiff NLP candidates approved.
- G0-C: versioned scaffolding, guardrails and read-only inspection approved.
- G1-METADATA-2: first recursive metadata resolution remains preserved as BLOCKED because `antlr4-python3-runtime==4.9.*` has no compatible CPython 3.12/Windows wheel.
- G1-METADATA-2 remediation: owner-authorized metadata-only review of `omegaconf==2.0.6`; revised lock and orchestrator review are tracked separately and do not authorize installation.
- G1-METADATA-2 remediation review: `READY_FOR_G1_OP_REVIEW`; the v4 lock is complete and preserves the wheel-only `omegaconf==2.0.6` compatibility choice.
- G1-OP-V4: `APPROVED` and `COMPLETED`; the external CPython 3.12.12 environment contains all 121 locked requirements, including the 18 Windows XPU/Intel oneMKL wheels, plus pinned LLaMA-Factory. `uv pip check` passes.
- G2: `READY`; the runtime smoke suite passed with one XPU device and finite synthetic forward/backward/optimizer results. See `reports/runtime-g2-v2.json` and `reports/runtime-g2-review.md`.
- G2-OP: `APPROVED` and `COMPLETED`; the ten pinned Qwen files were retrieved to the external cache and independently verified against the model manifest. The model was not loaded.
- G3: `APPROVED_RETRIEVED`; the three pinned Portuguese source files were retrieved to the external cache, hash-verified and made read-only. No source text was added to the repository.
- G4: `DATA_BLOCKED`; validation found cross-split overlap/near-duplicates, one direct phone indicator, 67 sensitive-content indicators and one non-Portuguese heuristic finding. See `reports/data-readiness-g4.md` and `manifests/dataset-validation-g4.json`.
- G4-REMEDIATION: `APPROVED`; the separately authorized transformation-v1 candidate was created outside the repository with redaction, exclusion reasons and row lineage. The candidate is `DERIVED_CANDIDATE_READY`; the original G4 remains `DATA_BLOCKED` and training is still closed.
- G4-DERIVED: `DATA_READY` for the prepared candidate only; the original source decision remains `DATA_BLOCKED`. This readiness permits the next strategy and compatibility review, not model loading or training.
- G5: strategy and non-operational compatibility review are `READY`; the Qwen config/tokenizer, Qwen template, Alpaca schema, external paths, runtime and XPU metadata passed without deserializing weights. See `reports/strategy-g5.md` and `reports/compatibility-g5.json`.
- G6: `READY_FOR_DRY_VALIDATION`; license, privacy, cost, hashes, schema, no-overwrite and Constitution review passed. Only the representative microbatch/frozen-baseline validation is open; principal training remains unauthorized.
- Data preparation is complete for the candidate only. Inference, baseline, dry validation and training remain closed until the candidate is reviewed by the later execution gates.

No script in this directory grants authority by itself. Gate records must be validated before an operational action. Environment creation, model retrieval and the approved derived-data preparation are complete under their gates; inference, dry validation and training remain prohibited while the original G4 is `DATA_BLOCKED` and later execution gates are absent.

## Versioned layout

- `manifests/`: identities, schemas, policies and future gate records; never source text or weights.
- `reports/`: inspection and review evidence; never private data or full third-party content.
- `scripts/`: deterministic guardrails and entry points.
- `tests/`: guardrail and validation tests.
- `configs/`: future reviewed configuration proposals only.

## Non-versioned layout

Heavy and third-party artifacts are permitted only below `%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/` after their specific authorization. The repository path is never an allowed fallback.
