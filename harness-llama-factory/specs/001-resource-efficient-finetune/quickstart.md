# Quickstart Validation Guide: Resource-Efficient First Fine-Tuning Experiment

**Date**: 2026-08-21

**Current state**: The first G1-METADATA-2 lock remains preserved as `BLOCKED` because `antlr4-python3-runtime==4.9.*` has no compatible CPython 3.12/Windows wheel. The owner-authorized remediation lock using `omegaconf==2.0.6` is complete, G1-OP-V4 and G2 passed, and G2-OP completed retrieval of the exact ten-file Qwen revision with size/hash evidence. The model remains unloaded. Dataset retrieval, data preparation, inference, baseline, dry validation and training remain closed.

This guide defines how the implemented experiment will be validated. Commands under a closed gate are examples for the future implementation and are not authorization to execute them.

## 1. Confirm source-of-truth artifacts

Expected prerequisites:

- `spec.md` status is `Approved (Gate G0)`.
- `plan.md`, `research.md` and `data-model.md` contain no unresolved clarification placeholders.
- Constitution version is 1.1.0.
- Proposed source revisions match `research.md`.

Read-only validation:

```powershell
rg -n "Status|Approved|7ae557604adf67be50417f59c2c2f167def9a775|606156db529f327fd871515cccbe14dcbafef682" specs/001-resource-efficient-finetune .specify/memory/constitution.md
```

Expected outcome: G0 approval is visible, immutable revisions are present, and no unresolved clarification exists.

## 2. Gate G0-B — owner reviews sources and terms

The owner must explicitly approve or reject:

- Qwen2.5-0.5B-Instruct at the pinned revision under Apache-2.0.
- Cardiff NLP Portuguese Tweet Sentiment at the pinned revision under CC BY 3.0 plus applicable X/Twitter terms.
- Local, non-versioned storage of source and derived text with no redistribution.

Expected outcome: a dated decision is recorded. Rejection returns to planning. Approval accepts only the approach, source candidates and documented terms/risks; it does not authorize environment creation, dependency installation, dataset retrieval, model retrieval, data preparation, baseline execution, dry validation or training. Each operational transition requires its own explicit authorization at the applicable gate.

Recorded decision: **APPROVED on 2026-08-21 for planning and provisional candidates only**. All operational authorizations remain closed.

## 2A. Gate G0-C — non-operational implementation

Recorded decision: **APPROVED on 2026-08-21** for versioned scaffolding, guardrails and read-only inspections. The approval explicitly excludes environment creation, dependency installation, model or dataset retrieval, data preparation, inference, baseline execution, dry validation and training.

## 3. Gates G1, G1-OP, G2 and G2-OP — environment validation

G1 is read-only. Before creating an environment or installing dependencies, the owner must explicitly approve the exact environment location, package set, network access and expected disk impact at G1-OP. After runtime validation at G2, model files remain unavailable until the owner separately approves the exact model revision, license, cache location and expected download size at G2-OP.

After installation authority is granted, implementation will provide:

```powershell
powershell -File experiments/001-resource-efficient-finetune/scripts/inspect_environment.ps1
powershell -File experiments/001-resource-efficient-finetune/scripts/resolve_runtime.ps1 -DryRun
powershell -File experiments/001-resource-efficient-finetune/scripts/validate_runtime.ps1 -OutputPath experiments/001-resource-efficient-finetune/reports/runtime-g2-v2.json
```

Expected evidence:

- Complete Windows build/channel and Intel driver identity.
- Separate CPython 3.12 x64 environment.
- Locked stable Windows wheels, including the matched XPU trio.
- Clean dependency check and LlamaFactory environment report.
- `torch.xpu.is_available() == True` and one expected XPU device.
- Synthetic tensor, matrix multiplication, embedding, normalization, loss, backward and optimizer-step tests pass with finite values.
- CPU diagnostics are reported separately and never selected silently.

Failure outcome: `ENVIRONMENT_BLOCKED`; do not retrieve model weights or begin strategy work.

## 4. Gate G3/G4 — dataset compliance and readiness

After dataset terms and retrieval are authorized, the `dataset-specialist` will use `dataset-preparation` through deterministic scripts:

```powershell
powershell -File experiments/001-resource-efficient-finetune/scripts/fetch_dataset_source.ps1
uv run --python 3.12 python experiments/001-resource-efficient-finetune/scripts/validate_dataset.py
uv run --python 3.12 python experiments/001-resource-efficient-finetune/scripts/prepare_dataset.py
uv run --python 3.12 pytest experiments/001-resource-efficient-finetune/tests
```

Expected evidence:

- Source bytes stored outside the repository and made read-only.
- Revision and file checksums match the source manifest.
- Observed split/class counts, lengths, encoding, language, PII, sensitive content and label-policy findings are reported.
- Zero exact or normalized train/test overlap; near-duplicates are quantified and reviewed.
- Derived UTF-8 JSONL and lineage manifest are separate from the source.
- LlamaFactory schema check passes.
- `dataset-specialist` returns `READY` or `BLOCKED`.

Failure outcome: `DATA_BLOCKED`; the `training-engineer` remains inactive.

## 5. Gate G5 — strategy and feasibility

Only after `DATA_READY`, the `training-engineer` applies `fine-tuning-strategy` and `llama-factory` to create a proposed configuration. Required validations include:

```powershell
uv run --python 3.12 llamafactory-cli env
uv run --python 3.12 python experiments/001-resource-efficient-finetune/scripts/validate_model_compatibility.py
```

Expected evidence:

- Compatibility evidence and conservative estimates from the validated environment and approved local model cache.
- Proposed device placement, dtype, memory budget, thermal monitoring and stop conditions.
- Conservative projected principal-run duration of at most 60 minutes, pending G6 measurement.
- Proposed LlamaFactory configuration is complete but not yet executed.

Failure outcome: strategy is rejected or the experiment is blocked. No silent reduction or fallback is allowed.

## 6. Gate G6 — frozen baseline and configuration review

G6 is strictly ordered. First, the `orchestrator` reviews licenses, privacy, cost, no-overwrite protection, hashes, schema and configuration consistency. Only after that review passes may the `training-engineer` perform the frozen baseline and one representative microbatch dry validation without starting the principal run.

The G6 dry validation includes:

```powershell
uv run --python 3.12 python experiments/001-resource-efficient-finetune/scripts/benchmark_microbatch.py
```

Expected evidence:

- Frozen prompt, template, parser, test manifest and base predictions.
- Accuracy, macro-F1 and invalid-label rate for the base model.
- Configuration hash, environment hash, input hashes, seed policy, estimates, unique output path and stop conditions.
- Prior orchestrator confirmation of licenses, privacy, non-overwrite and constitutional compliance.
- One representative microbatch completes forward, loss and backward without an optimizer update or checkpoint.
- Peak shared memory, dtype, device placement and thermal behavior are recorded; the measured projection remains at most 60 minutes.

## 7. Gate G7 — explicit training authorization

The owner must approve the exact configuration hash and run identifier. Approval of the spec, plan, environment, dataset or dry validation does not authorize training.

The implementation must not expose or document a copy-paste principal training command before this gate. Once authorized, the `training-engineer` runs exactly one principal execution under the approved 60-minute stop condition.

## 8. Gate G8 — evaluation and closure

After an authorized run, the same frozen evaluation procedure is applied to the adapter result.

Expected outcome:

- 100% of test records receive base and adapted predictions.
- Accuracy, macro-F1 and invalid-label rate are recorded for both.
- SC-008 is evaluated using the correct baseline branch.
- Logs, metrics, adapter/checkpoints and predictions remain in the unique non-versioned run directory.
- Versioned reports contain hashes and summaries, not weights or source text.
- Final status is `SUCCESSFUL`, `UNSUCCESSFUL` or `BLOCKED`.

## Stop Conditions

Stop immediately and preserve evidence if any of the following occurs:

- source terms are rejected or unclear;
- XPU is unavailable or required operations fall back unexpectedly;
- non-finite values, OOM, severe paging or thermal throttling appears;
- projected or elapsed duration exceeds 60 minutes;
- configuration, data or source identity differs from the approved hash;
- an output path already exists;
- a privacy, contamination or schema blocker appears;
- authorization is absent or no longer matches the effective proposal.
