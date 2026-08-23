# Traceability and closure report

**Feature:** `001-resource-efficient-finetune`  
**Closure date:** 2026-08-22  
**Constitution:** 1.1.0

This report closes the remaining traceability task. Evidence paths are versioned summaries or manifests; model weights, source text, caches, logs and checkpoints remain external.

## Functional requirements

| Requirement | Status | Evidence |
|---|---|---|
| FR-001 — three fixed Portuguese sentiment labels | PASS | `manifests/dataset-info.json`; `reports/evaluation-g8.json` |
| FR-002 — one pinned model and dataset with licenses | PASS | `manifests/model-source.json`; `manifests/dataset-source.json`; `reports/data-compliance-g3.md` |
| FR-003 — 200–2,000 training records and class distribution | PASS | `manifests/dataset-info.json` (`1,792` training records); `reports/data-readiness-g4-derived.md` |
| FR-004 — dataset-specialist readiness decision | PASS | `reports/data-readiness-g4.md`; `reports/data-readiness-g4-derived.md`; `manifests/gates/g4-derived.json` |
| FR-005 — immutable source and derived lineage | PASS | `manifests/dataset-source.json`; external `lineage.jsonl` identity in `manifests/dataset-info.json` |
| FR-006 — observed environment and hardware | PASS | `reports/environment-g1.json`; `reports/runtime-g2-v2.json` |
| FR-007 — compatibility, resource and duration estimate | PASS | `reports/compatibility-g5.json`; `reports/benchmark-g6.json`; `reports/strategy-g5.md` |
| FR-008 — reproducible execution settings and stop conditions | PASS | `configs/sft-lora-proposal-v3.yaml`; `manifests/execution-proposal-v3.json` |
| FR-009 — licenses, privacy and sensitive-content review | PASS | `reports/data-compliance-g3.md`; `reports/data-readiness-g4-derived.md`; `reports/config-review-g6.md` |
| FR-010 — ordered gates before training | PASS | `manifests/gates/`; `manifests/experiment-run-v3.json` |
| FR-011 — scope and material-change protection | PASS | `scripts/validate_gate.py`; `scripts/run_authorized_experiment_v3.ps1`; `manifests/execution-proposal-v3.json` |
| FR-012 — no overwrite | PASS | `scripts/path_guards.py`; `scripts/manifest_utils.py`; `manifests/experiment-run-v3.json` |
| FR-013 — audit and reproduction record | PASS | `manifests/experiment-run-v3.json`; `reports/evaluation-g8.json`; external run logs |
| FR-014 — frozen base-versus-adapter comparison | PASS | `reports/benchmark-g6.json`; `reports/evaluation-g8.json` |
| FR-015 — unambiguous final outcome | PASS | `reports/final-evaluation-g8.md` (`SUCCESSFUL`) |
| FR-016 — LLaMA-Factory canonical interface | PASS | `configs/sft-lora-proposal-v3.yaml`; `manifests/execution-proposal-v3.json` |
| FR-017 — model, dataset and configuration compatibility | PASS | `reports/compatibility-g5.json`; `tests/test_llamafactory_compatibility.py` |
| FR-018 — external-only protected artifacts | PASS | `manifests/storage-policy.json`; `reports/repository-safety.md` |
| FR-019 — frozen prompt, template, parser and scoring | PASS | `reports/benchmark-g6.json`; `scripts/evaluate_frozen_set.py`; `reports/evaluation-g8.json` |
| FR-020 — local, no external compute, ≤1.5B parameters, ≤60 minutes | PASS | `reports/runtime-g2-v2.json`; `manifests/model-source.json`; `manifests/experiment-run-v3.json` |
| FR-021 — documented stable dependency remediation | PASS | `manifests/runtime-metadata-lock-g1-metadata-2-omegaconf-2.0.6-xpu-v4.json`; `reports/runtime-metadata-review-g1-metadata-2-omegaconf-2.0.6.md` |
| FR-022 — platform-specific accelerator runtime lock | PASS | `manifests/runtime-metadata-lock-g1-metadata-2-omegaconf-2.0.6-xpu-v4.json`; `reports/runtime-g2-v2.json` |

## Success criteria

| Criterion | Status | Evidence / observed result |
|---|---|---|
| SC-001 — dated gates and zero-step blocking | PASS | G1 through G7-V3 manifests; prior failed v1 run preserved with zero training steps |
| SC-002 — valid prepared data, lineage and ready decision | PASS | Derived candidate: 1,792/314/854 records; `manifests/dataset-info.json`; G4-derived report |
| SC-003 — local run within 60 minutes | PASS | G7-V3 completed in approximately 39.45 minutes; `hard_stop_minutes=60` |
| SC-004 — no overwrite | PASS | 47 unit tests including path/proposal/run guard tests; external-only artifact scan |
| SC-005 — 100% frozen evaluation coverage | PASS | 90/90 records, 30 per class; `reports/evaluation-g8.json` |
| SC-006 — complete reproducibility record | PASS | v3 proposal, runtime, model, dataset, run and evaluation manifests |
| SC-007 — clear final status | PASS | G8 decision `SUCCESSFUL` and final report |
| SC-008 — required quality improvement | PASS | Base macro-F1 `0.4044`; adapted `0.6891`; improvement `+0.2847`; invalid rate `0%` |

## Closure decision

All functional requirements and measurable success criteria have evidence. The principal experiment is closed as `SUCCESSFUL`; no retraining or artifact migration is required.
