# Tasks: Resource-Efficient First Fine-Tuning Experiment

**Input**: Design documents from `specs/001-resource-efficient-finetune/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, Constitution 1.1.0

**Current gate**: G1-OP-V4 completed and G2 is `READY` after the local runtime smoke validation. G2-OP remains pending owner approval for the exact Qwen revision, Apache-2.0 use, external cache path and 999,604,126-byte retrieval estimate. Dataset, data preparation, inference, baseline, dry validation and training remain closed until their named gates.

**Tests**: Tests are included because the approved plan requires deterministic schema, lineage, isolation, parsing, metrics, runtime and no-overwrite validation.

**Organization**: Tasks are grouped by user story and ordered so no dataset, strategy or execution work can bypass its constitutional owner or gate.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create versioned experiment scaffolding and governance records without installing or retrieving external artifacts.

- [X] T001 Create the versioned experiment directory map and ownership notes in experiments/001-resource-efficient-finetune/README.md
- [X] T002 [P] Record approved specification, plan, Constitution version, G0-B decision and G0-C decision identities in experiments/001-resource-efficient-finetune/manifests/governance.json
- [X] T003 [P] Add model, dataset, environment and run state schemas from data-model.md to experiments/001-resource-efficient-finetune/manifests/schemas.json
- [X] T004 [P] Add repository protection rules for local environments, caches, source data, derived data, weights, checkpoints and logs to experiments/001-resource-efficient-finetune/manifests/storage-policy.json

**Checkpoint**: Versioned scaffolding exists, but no local environment or third-party artifact has been created.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement deterministic guardrails shared by every story.

**CRITICAL**: No user-story operational task may proceed until these checks exist and pass.

- [X] T005 [P] Implement canonical JSON and SHA-256 manifest helpers in experiments/001-resource-efficient-finetune/scripts/manifest_utils.py
- [X] T006 [P] Implement unique-output and no-overwrite guards in experiments/001-resource-efficient-finetune/scripts/path_guards.py
- [X] T007 [P] Implement gate-state validation that denies missing, stale or scope-mismatched approvals in experiments/001-resource-efficient-finetune/scripts/validate_gate.py
- [X] T008 [P] Test manifest determinism and hash stability in experiments/001-resource-efficient-finetune/tests/test_manifest_utils.py
- [X] T009 [P] Test rejection of existing or repository-internal heavy-artifact paths in experiments/001-resource-efficient-finetune/tests/test_path_guards.py
- [X] T010 [P] Test gate-state denial for absent and materially changed approvals in experiments/001-resource-efficient-finetune/tests/test_gate_validation.py
- [X] T011 Document stop conditions and evidence-preservation behavior in experiments/001-resource-efficient-finetune/reports/stop-conditions.md

**Checkpoint**: Shared safety controls are independently testable and block unauthorized transitions.

---

## Phase 3: User Story 1 — Review a Viable First Experiment (Priority: P1) — MVP

**Goal**: Produce read-only environment evidence and exact operational proposals so the owner can make separate G1-OP and G2-OP decisions.

**Independent Test**: Verify the report identifies the observed machine, isolated environment path, direct package proposal, network/disk impact, XPU risks, model revision and every still-closed gate without claiming runtime readiness.

### Tests for User Story 1

- [X] T012 [P] [US1] Define environment-profile schema and fixture validation tests in experiments/001-resource-efficient-finetune/tests/test_environment_profile.py
- [X] T013 [P] [US1] Test that runtime proposal generation performs no install or network access and rejects source builds, nightly wheels and Python 3.14 in experiments/001-resource-efficient-finetune/tests/test_runtime_resolution.py

### Non-operational implementation for User Story 1

- [X] T014 [US1] Implement read-only Windows, CPU, GPU, driver, RAM, pagefile, disk, power, Python and uv inspection in experiments/001-resource-efficient-finetune/scripts/inspect_environment.ps1
- [X] T015 [US1] Run the read-only inspector and write the dated G1 evidence to experiments/001-resource-efficient-finetune/reports/environment-g1.json
- [X] T016 [US1] Implement offline runtime-proposal generation with exact direct requirements, approved paths, network endpoints, policy limits and unresolved transitive-resolution evidence in experiments/001-resource-efficient-finetune/scripts/resolve_runtime.ps1
- [X] T017 [US1] Run the offline resolver without installation or network access and write experiments/001-resource-efficient-finetune/manifests/runtime-proposal.json
- [X] T018 [US1] Have the orchestrator review G1 evidence and record READY, BLOCKED or NEEDS_AUTHORIZATION with the exact next request in experiments/001-resource-efficient-finetune/reports/environment-g1-review.md

### Gated operational implementation for User Story 1

- [X] T019 [US1] Record the owner's G1-OP decision and enforce a hard stop when absent or rejected in experiments/001-resource-efficient-finetune/manifests/gates/g1-op.json
- [X] T020 [US1] Implement isolated CPython 3.12 environment creation and locked installation logic without executing it in experiments/001-resource-efficient-finetune/scripts/create_environment.ps1
- [X] T021 [US1] After approved G1-OP-V4 only, execute experiments/001-resource-efficient-finetune/scripts/create_environment.ps1 and preserve its package-resolution evidence
- [X] T022 [US1] Implement dependency, LLaMA-Factory and synthetic XPU validation without executing it in experiments/001-resource-efficient-finetune/scripts/validate_runtime.ps1
- [X] T023 [US1] After T021 only, execute experiments/001-resource-efficient-finetune/scripts/validate_runtime.ps1 and record G2 READY or BLOCKED in experiments/001-resource-efficient-finetune/reports/runtime-g2-v2.json
- [X] T024 [US1] Have the orchestrator record the G2 review and exact model download size, cache path and G2-OP request in experiments/001-resource-efficient-finetune/reports/runtime-g2-review.md
- [ ] T025 [US1] Record the owner's G2-OP decision and enforce a hard stop when absent or rejected in experiments/001-resource-efficient-finetune/manifests/gates/g2-op.json
- [ ] T026 [US1] Implement pinned-model retrieval and hash verification without executing it in experiments/001-resource-efficient-finetune/scripts/fetch_model_source.py
- [ ] T027 [US1] After approved G2-OP only, execute experiments/001-resource-efficient-finetune/scripts/fetch_model_source.py and record file hashes in experiments/001-resource-efficient-finetune/manifests/model-source.json

**Checkpoint**: US1 is complete only when the experiment is technically reviewable; a rejected authorization produces a documented BLOCKED result without fallback.

---

## Phase 4: User Story 2 — Validate a Simple Dataset Safely (Priority: P2)

**Goal**: Validate the immutable Portuguese dataset source and create a separate traceable LLaMA-Factory derivative under `dataset-specialist` ownership.

**Independent Test**: Verify original bytes remain read-only, every derived row has lineage, schema and contamination checks pass, findings are quantified, and the specialist returns exactly DATA_READY or DATA_BLOCKED.

### Tests for User Story 2

- [ ] T028 [P] [US2] Test source immutability, pinned revision and checksum enforcement in experiments/001-resource-efficient-finetune/tests/test_dataset_source.py
- [ ] T029 [P] [US2] Test required fields, UTF-8 decoding, length limits and numeric label validity in experiments/001-resource-efficient-finetune/tests/test_dataset_schema.py
- [ ] T030 [P] [US2] Test exact, normalized and near-duplicate split isolation in experiments/001-resource-efficient-finetune/tests/test_split_isolation.py
- [ ] T031 [P] [US2] Test the 0-to-negativo, 1-to-neutro and 2-to-positivo transformation and Alpaca record schema in experiments/001-resource-efficient-finetune/tests/test_dataset_conversion.py
- [ ] T032 [P] [US2] Test privacy, sensitive-content and Portuguese-scope finding aggregation in experiments/001-resource-efficient-finetune/tests/test_dataset_policy.py

### Implementation for User Story 2

- [ ] T033 [US2] Have the dataset-specialist use dataset-preparation to document CC BY 3.0, applicable X/Twitter terms, privacy risks, storage path and exact G3 request in experiments/001-resource-efficient-finetune/reports/data-compliance-g3.md
- [ ] T034 [US2] Record the owner's terms acceptance and dataset retrieval decision, blocking access when absent or rejected, in experiments/001-resource-efficient-finetune/manifests/gates/g3.json
- [ ] T035 [US2] Implement pinned dataset retrieval without executing it in experiments/001-resource-efficient-finetune/scripts/fetch_dataset_source.ps1
- [ ] T036 [US2] After approved G3 only, execute experiments/001-resource-efficient-finetune/scripts/fetch_dataset_source.ps1 without transformation
- [ ] T037 [US2] Make the retrieved source read-only and record revision, LFS identities, byte sizes and SHA-256 hashes in experiments/001-resource-efficient-finetune/manifests/dataset-source.json
- [ ] T038 [US2] Implement dataset validation without reading source data yet in experiments/001-resource-efficient-finetune/scripts/validate_dataset.py
- [ ] T039 [US2] After T037 only, execute experiments/001-resource-efficient-finetune/scripts/validate_dataset.py and record counts, labels, lengths, language, duplicates, PII and sensitive-content findings
- [ ] T040 [US2] Implement separate derived-data and row-lineage creation without executing it in experiments/001-resource-efficient-finetune/scripts/prepare_dataset.py
- [ ] T041 [US2] After validation passes only, execute experiments/001-resource-efficient-finetune/scripts/prepare_dataset.py to create separate train, validation, frozen-test and lineage artifacts
- [ ] T042 [US2] Register the derived Alpaca schema without source text in experiments/001-resource-efficient-finetune/manifests/dataset-info.json
- [ ] T043 [US2] Have the dataset-specialist issue the quantified G4 DATA_READY or DATA_BLOCKED decision in experiments/001-resource-efficient-finetune/reports/data-readiness-g4.md

**Checkpoint**: The `training-engineer` remains inactive unless T043 is DATA_READY.

---

## Phase 5: User Story 3 — Authorize and Run the Bounded Experiment (Priority: P3)

**Goal**: Produce a resource-compatible proposal, validate it in constitutional order and run exactly one principal experiment only after explicit G7 authorization.

**Independent Test**: Confirm that a missing DATA_READY, runtime READY, orchestrator review, dry-validation result or exact G7 approval causes zero principal training steps.

### Tests for User Story 3

- [ ] T044 [P] [US3] Test LLaMA-Factory dataset registration, template and exact-label parser compatibility in experiments/001-resource-efficient-finetune/tests/test_llamafactory_compatibility.py
- [ ] T045 [P] [US3] Test configuration completeness, material-change invalidation and unique run identity in experiments/001-resource-efficient-finetune/tests/test_execution_proposal.py
- [ ] T046 [P] [US3] Test the 60-minute stop condition, non-finite loss stop and no-silent-fallback policy in experiments/001-resource-efficient-finetune/tests/test_run_guards.py

### Implementation for User Story 3

- [ ] T047 [US3] After DATA_READY only, have the training-engineer use fine-tuning-strategy and llama-factory to justify all settings in experiments/001-resource-efficient-finetune/reports/strategy-g5.md
- [ ] T048 [US3] Create the proposed but non-authorized LLaMA-Factory configuration in experiments/001-resource-efficient-finetune/configs/sft-lora-proposal.yaml
- [ ] T049 [US3] Implement model, tokenizer, template, dataset and config validation without executing it in experiments/001-resource-efficient-finetune/scripts/validate_model_compatibility.py
- [ ] T050 [US3] Execute experiments/001-resource-efficient-finetune/scripts/validate_model_compatibility.py without principal training and preserve its evidence
- [ ] T051 [US3] Have the orchestrator perform the first G6 license, privacy, cost, hash, schema, no-overwrite and Constitution review in experiments/001-resource-efficient-finetune/reports/config-review-g6.md
- [ ] T052 [US3] Implement frozen-baseline and microbatch dry validation without executing it in experiments/001-resource-efficient-finetune/scripts/benchmark_microbatch.py
- [ ] T053 [US3] After T051 passes only, have the training-engineer execute experiments/001-resource-efficient-finetune/scripts/benchmark_microbatch.py and record baseline and forward-loss-backward evidence
- [ ] T054 [US3] Freeze configuration, environment, input, run, path, estimate and stop-condition hashes in experiments/001-resource-efficient-finetune/manifests/execution-proposal.json
- [ ] T055 [US3] Record the owner's exact G7 run authorization and block absent, stale or mismatched approval in experiments/001-resource-efficient-finetune/manifests/gates/g7.json
- [ ] T056 [US3] Implement guarded principal execution without running it in experiments/001-resource-efficient-finetune/scripts/run_authorized_experiment.ps1
- [ ] T057 [US3] After valid G7 only, have the training-engineer execute experiments/001-resource-efficient-finetune/scripts/run_authorized_experiment.ps1 exactly once
- [ ] T058 [US3] Preserve status, timestamps, logs, metrics, checkpoints, memory, duration, interruptions and deviations in experiments/001-resource-efficient-finetune/manifests/experiment-run.json

**Checkpoint**: US3 completes with one preserved COMPLETED, FAILED or STOPPED run record; no implicit retry is allowed.

---

## Phase 6: User Story 4 — Evaluate and Reproduce the Result (Priority: P4)

**Goal**: Compare unchanged base and adapted behavior on the same frozen test set and preserve enough evidence to reproduce the experiment.

**Independent Test**: Recompute accuracy, macro-F1, invalid-label rate and SC-008 from preserved ordered predictions and verify all identities are resolvable.

### Tests for User Story 4

- [ ] T059 [P] [US4] Test exact-label parsing, invalid-output accounting and deterministic ordering in experiments/001-resource-efficient-finetune/tests/test_prediction_parser.py
- [ ] T060 [P] [US4] Test accuracy, macro-F1 and both SC-008 threshold branches in experiments/001-resource-efficient-finetune/tests/test_metrics.py
- [ ] T061 [P] [US4] Test reproduction-manifest completeness and checksum verification in experiments/001-resource-efficient-finetune/tests/test_reproducibility.py

### Implementation for User Story 4

- [ ] T062 [US4] Implement frozen-set base-versus-adapter evaluation without executing it in experiments/001-resource-efficient-finetune/scripts/evaluate_frozen_set.py
- [ ] T063 [US4] Execute experiments/001-resource-efficient-finetune/scripts/evaluate_frozen_set.py with identical frozen inputs, prompt, template, parser and generation settings
- [ ] T064 [US4] Record ordered prediction hashes, metrics, regressions and SC-008 outcome in experiments/001-resource-efficient-finetune/manifests/evaluation-record.json
- [ ] T065 [US4] Have the orchestrator classify the experiment as SUCCESSFUL, UNSUCCESSFUL or BLOCKED in experiments/001-resource-efficient-finetune/reports/final-evaluation-g8.md

**Checkpoint**: The result is interpretable and reproducible without versioning weights, source text, private data or checkpoints.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate traceability and documentation after the selected stories reach a terminal state.

- [ ] T066 [P] Verify every functional requirement and success criterion has evidence or a documented blocker in experiments/001-resource-efficient-finetune/reports/traceability.md
- [ ] T067 [P] Run repository-protection and secret/heavy-artifact scans and record only the summary in experiments/001-resource-efficient-finetune/reports/repository-safety.md
- [ ] T068 Execute applicable quickstart validations and record pass, fail or not-authorized status in experiments/001-resource-efficient-finetune/reports/quickstart-validation.md
- [ ] T069 Re-run Graphify after code changes and document refreshed experiment relationships in experiments/001-resource-efficient-finetune/reports/graphify-update.md

---

## Dependencies & Execution Order

- **Setup** begins after G0-C and performs no operational actions.
- **Foundational** depends on Setup and blocks all user stories.
- **US1 non-operational work through T018** is authorized by G0-C.
- **T021** requires G1-OP; **T027** requires G2-OP.
- **US2 retrieval** requires G3 and remains owned by `dataset-specialist` using `dataset-preparation`.
- **US3** requires G2 READY and G4 DATA_READY; strategy remains owned by `training-engineer` using `fine-tuning-strategy` and `llama-factory`.
- **T053** requires prior orchestrator G6 review; **T057** requires exact G7 authorization.
- **US4** depends on a preserved US3 run and frozen baseline evidence.

```text
G0-C → Setup → Foundational → US1 read-only G1 review → STOP at next authorization
G1-OP → runtime creation → G2 → G2-OP → model retrieval
G3 → US2 DATA_READY → US3 G5/G6 → G7 → principal run → US4/G8
```

## Parallel Opportunities

- T002, T003 and T004 can run in parallel after T001.
- T005 through T010 can be split by file while T011 is documented.
- T012 and T013 can run in parallel.
- T028 through T032 can run in parallel.
- T044 through T046 can run in parallel after DATA_READY.
- T059 through T061 can run in parallel after evaluation interfaces are frozen.
- T066 and T067 can run in parallel after terminal evidence exists.

## Implementation Strategy

### Authorized MVP Tranche

1. Complete T001–T011 for versioned scaffolding and shared guardrails.
2. Complete T012–T017 for read-only environment evidence and offline runtime proposal.
3. Complete T018 through an orchestrator review.
4. Stop before T019/T021 and request only the authorization identified by the evidence.

### Gate Discipline

The presence or implementation of a task is not authorization to execute an operational action. Every execution task must validate its recorded gate. A failed or absent gate ends the branch as BLOCKED and preserves evidence without silently switching device, model, dataset, environment or compute location.

## Phase 8: Convergence — Metadata-Only Resolution Before G1-OP

**Purpose**: Close the G1 metadata gap under the owner's narrow HTTPS GET/HEAD authorization. This phase must complete before T019 and does not authorize environment creation or installation.

- [X] T070 [US1] Record the exact G1-METADATA-2 authorization, endpoint allowlist, allowed HTTP methods, permitted outputs and prohibited payload/actions in experiments/001-resource-efficient-finetune/manifests/gates/g1-metadata-2.json per FR-010
- [X] T071 [US1] Implement and test fail-closed recursive metadata resolution that rejects non-allowlisted hosts, non-GET/HEAD methods and package payload downloads in experiments/001-resource-efficient-finetune/scripts/resolve_package_metadata.py and experiments/001-resource-efficient-finetune/tests/test_package_metadata_resolution.py
- [X] T072 [US1] Execute the metadata-only resolver and write immutable CPython identity, dependency candidates, hashes, sizes, compatibility evidence and transfer/cache/install estimates or explicit unresolved evidence to experiments/001-resource-efficient-finetune/manifests/runtime-metadata-lock-g1-metadata-2-v2.json
- [X] T073 [US1] Have the orchestrator review the G1-METADATA-2 lock and record READY, BLOCKED or NEEDS_AUTHORIZATION before T019 in experiments/001-resource-efficient-finetune/reports/runtime-metadata-review-g1-metadata-2.md per Constitution II and G1
- [X] T074 [US1] Record the owner's 2026-08-22 authorization and the explicit `omegaconf==2.0.6` remediation candidate in the Spec Kit and governance manifest
- [X] T075 [US1] Add a fail-closed exact-version override interface to the metadata resolver and test normalization, stability and constraint enforcement in experiments/001-resource-efficient-finetune/scripts/resolve_package_metadata.py and experiments/001-resource-efficient-finetune/tests/test_package_metadata_resolution.py
- [X] T076 [US1] Execute the metadata-only resolver with `omegaconf==2.0.6` and write the versioned candidate lock to experiments/001-resource-efficient-finetune/manifests/runtime-metadata-lock-g1-metadata-2-omegaconf-2.0.6.json without overwriting the prior blocked lock
- [X] T077 [US1] Fix legacy wildcard lower-bound handling such as `PyYAML (>=5.1.*)` in the metadata resolver and add a regression test without relaxing the wheel-only policy
- [X] T078 [US1] Execute the corrected metadata-only resolver with `omegaconf==2.0.6` and write the immutable v2 candidate lock to experiments/001-resource-efficient-finetune/manifests/runtime-metadata-lock-g1-metadata-2-omegaconf-2.0.6-v2.json
- [X] T079 [US1] Have the orchestrator review the revised v2 lock and record the G1-OP proposal boundary or remaining blocker in experiments/001-resource-efficient-finetune/reports/runtime-metadata-review-g1-metadata-2-omegaconf-2.0.6.md
- [X] T080 [US1] Preserve the partial G1-OP installation evidence and block completion when `uv pip check` finds platform-specific XPU requirements absent from the approved lock
- [X] T081 [US1] Extend metadata resolution with the Windows XPU Intel/oneMKL runtime graph and the pinned `pytorch-triton-xpu==3.5.0` wheel candidate
- [X] T082 [US1] Generate the v3 metadata lock with the platform-specific XPU runtime set; the only remaining failure was the index filename normalization for `pytorch-triton-xpu`
- [X] T083 [US1] Fix XPU index filename normalization for hyphen/underscore package names and regression-check the `pytorch-triton-xpu` candidate
- [X] T084 [US1] Generate the v4 metadata lock with the platform-specific XPU runtime set before requesting revised G1-OP approval
- [X] T085 [US1] Obtain explicit owner approval for the v4 lock hash, 18 additional XPU runtime packages, transfer estimate and existing external environment path

**Checkpoint**: T019 remains closed unless T079 concludes that a complete, owner-reviewable G1-OP proposal can be formulated. Metadata resolution never implies installation authority.
