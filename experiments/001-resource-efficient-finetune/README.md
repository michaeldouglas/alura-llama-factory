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
- G2-OP and every later operational gate: closed. Model and dataset retrieval, data preparation, inference, baseline, dry validation and training have not been authorized.

No script in this directory grants authority by itself. Gate records must be validated before an operational action. Environment creation, dependency installation, model or dataset retrieval, data preparation, inference, dry validation and training are currently prohibited.

## Versioned layout

- `manifests/`: identities, schemas, policies and future gate records; never source text or weights.
- `reports/`: inspection and review evidence; never private data or full third-party content.
- `scripts/`: deterministic guardrails and entry points.
- `tests/`: guardrail and validation tests.
- `configs/`: future reviewed configuration proposals only.

## Non-versioned layout

Heavy and third-party artifacts are permitted only below `%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/` after their specific authorization. The repository path is never an allowed fallback.
