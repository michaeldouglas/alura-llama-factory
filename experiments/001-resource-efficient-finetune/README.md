# Resource-Efficient First Fine-Tuning Experiment

This directory contains only versioned governance, validation code, manifests, configuration proposals and reports for feature `001-resource-efficient-finetune` on repository branch `feature/harness`.

## Current authorization

- G0: requirements approved.
- G0-B: plan and provisional Qwen/Cardiff NLP candidates approved.
- G0-C: versioned scaffolding, guardrails and read-only inspection approved.
- G1-OP and every later operational gate: closed.

No script in this directory grants authority by itself. Gate records must be validated before an operational action. Environment creation, dependency installation, model or dataset retrieval, data preparation, inference, dry validation and training are currently prohibited.

## Versioned layout

- `manifests/`: identities, schemas, policies and future gate records; never source text or weights.
- `reports/`: inspection and review evidence; never private data or full third-party content.
- `scripts/`: deterministic guardrails and entry points.
- `tests/`: guardrail and validation tests.
- `configs/`: future reviewed configuration proposals only.

## Non-versioned layout

Heavy and third-party artifacts are permitted only below `%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/` after their specific authorization. The repository path is never an allowed fallback.
