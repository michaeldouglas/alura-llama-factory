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
- G6 review: `READY_FOR_DRY_VALIDATION`; license, privacy, cost, hashes, schema, no-overwrite and Constitution review passed.
- G6 dry validation: `PASS`; the approved Qwen weights were loaded on the single XPU, one representative microbatch produced finite forward/backward values without optimizer update, and the deterministic frozen subset produced the preserved base baseline in `reports/benchmark-g6.json` and `manifests/gates/g6-validation.json`.
- G7: `BLOCKED_MISSING_EXACT_OWNER_AUTHORIZATION`; the fail-closed record is present in `manifests/gates/g7.json`. Principal training, checkpoint creation and adapter generation remain closed until the owner records exact matching authorization.
- Execution proposal: `PROPOSAL_ONLY`; configuration, runtime, input hashes, frozen evaluation selection, outputs, estimate and stop conditions are frozen in `manifests/execution-proposal.json`. It does not authorize execution.
- G7 execution: `FAILED` before the first training step with exit code `1` because the Windows `datasets` cache lock path exceeded the OS path limit (`WinError 206`). The single-run policy is preserved; there was no optimizer step or checkpoint, and retry is blocked pending a new materially reviewed proposal.
- Corrective proposal v3: the verified 8.3 external cache alias produced a simulated 237-character lock path. It is recorded in `configs/sft-lora-proposal-v3.yaml`, `manifests/execution-proposal-v3.json` and was executed once under `manifests/gates/g7-v3.json`.
- G7-V3 execution: `COMPLETED` in 39 minutes and 27 seconds; `checkpoint-448` and all run logs remain in the external v3 run directory.
- G8: `SUCCESSFUL`; the adapter improved frozen-set macro-F1 from `0.4044` to `0.6891`, accuracy from `0.5000` to `0.6889`, and reduced invalid labels from `1.11%` to `0%`. See `reports/final-evaluation-g8.md` and `reports/evaluation-g8.json`.

No script in this directory grants authority by itself. Gate records must be validated before an operational action. Environment creation, model retrieval, derived-data preparation and G6 dry validation are complete under their gates; the original G4 remains `DATA_BLOCKED`, and principal training remains prohibited while G7 is absent.

## Versioned layout

- `manifests/`: identities, schemas, policies and future gate records; never source text or weights.
- `reports/`: inspection and review evidence; never private data or full third-party content.
- `scripts/`: deterministic guardrails and entry points.
- `tests/`: guardrail and validation tests.
- `configs/`: future reviewed configuration proposals only.

## Non-versioned layout

Heavy and third-party artifacts are permitted only below `%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/` after their specific authorization. The repository path is never an allowed fallback.
