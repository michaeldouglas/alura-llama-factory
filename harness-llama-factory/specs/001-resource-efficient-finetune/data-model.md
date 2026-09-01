# Data Model: Resource-Efficient First Fine-Tuning Experiment

**Date**: 2026-08-21

## Entity Overview

| Entity | Purpose | Primary relationships |
|---|---|---|
| ExperimentSpecification | Approved objective, scope and success rules | Governs every other entity |
| ModelSource | Immutable base-model identity and usage terms | Referenced by ExecutionProposal and ExperimentRun |
| DatasetSource | Immutable original dataset identity and observations | Produces zero or one PreparedDataset version per transformation version |
| PreparedDataset | Validated, separate SFT-ready derivative | Required by ExecutionProposal |
| EnvironmentProfile | Observed machine and locked runtime evidence | Required by ExecutionProposal and ExperimentRun |
| ExecutionProposal | Reviewed method, settings, estimates and authorization state | Binds model, data, environment and output identity |
| ExperimentRun | One authorized execution and preserved outputs | Produces EvaluationRecord |
| EvaluationRecord | Frozen baseline/final predictions and comparison | Determines experiment outcome |

## ExperimentSpecification

Fields:

- `feature_id`: `001-resource-efficient-finetune`
- `spec_revision`: content hash of approved `spec.md`
- `approved_at`: approval timestamp
- `approved_by`: experiment owner identity or recorded role
- `task`: Portuguese sentiment classification
- `labels`: ordered set `negativo`, `neutro`, `positivo`
- `input_policy`: Portuguese, principal subject, at most 280 Unicode characters
- `resource_envelope`: local only, external cost R$ 0, model ≤1.5B, principal run ≤60 minutes
- `success_policy`: SC-008 threshold and 100% valid-label requirement

Validation rules:

- The specification must be approved before any source or runtime mutation.
- Any FR-011 material change creates a new spec revision and invalidates later approvals.

## ModelSource

Fields:

- `repository_id`
- `revision_sha`
- `parameter_count`
- `architecture`
- `declared_languages`
- `license_id`
- `license_hash`
- `gated`
- `file_manifest`: filename, size and checksum after approved retrieval
- `template_id`
- `approval_state`: `PROPOSED`, `APPROVED`, `REJECTED`

Validation rules:

- Repository and revision are mandatory and immutable.
- Parameter count must be at most 1.5B.
- License and usage review must pass.
- Only official source artifacts are accepted for the first run.

Proposed instance:

- `repository_id`: `Qwen/Qwen2.5-0.5B-Instruct`
- `revision_sha`: `7ae557604adf67be50417f59c2c2f167def9a775`
- `parameter_count`: 0.49B
- `license_id`: Apache-2.0

## DatasetSource

Fields:

- `repository_id`
- `revision_sha`
- `configuration`: `portuguese`
- `license_id`
- `additional_terms`
- `source_files`: paths and checksums after retrieval
- `declared_splits`
- `observed_splits`: recalculated counts and class distributions
- `privacy_findings`
- `quality_findings`
- `approval_state`: `PROPOSED`, `TERMS_ACCEPTED`, `VALIDATING`, `READY`, `BLOCKED`

Validation rules:

- Original files are read-only after retrieval.
- CC BY 3.0 and X/Twitter terms require explicit acceptance before retrieval.
- Split counts and hashes must be calculated from the pinned bytes.
- Privacy or license blockers force `BLOCKED`.

Proposed instance:

- `repository_id`: `cardiffnlp/tweet_sentiment_multilingual`
- `revision_sha`: `606156db529f327fd871515cccbe14dcbafef682`
- `configuration`: `portuguese`
- `declared_label_map`: `0=negative`, `1=neutral`, `2=positive`

## SourceRecord Observation

This is an in-memory validation view; it is not a new source file.

Fields:

- `source_split`
- `source_index`
- `text_raw`
- `label_raw`
- `unicode_length`
- `language_result`
- `principal_subject_result`
- `pii_flags`
- `sensitive_content_flags`
- `exact_hash`
- `normalized_hash`
- `near_duplicate_cluster`
- `policy_label_review`
- `eligibility`: `ELIGIBLE`, `EXCLUDED`, `REVIEW`
- `exclusion_reason`

Validation rules:

- `text_raw` is never modified in place.
- Eligible text is non-empty, primarily Portuguese, within 280 characters and has exactly one source label in 0–2.
- Exclusions are quantified and justified; absent text or labels are never invented.

## PreparedDataset

Fields:

- `dataset_id`
- `source_revision_sha`
- `transformation_version`
- `created_at`
- `created_by`: `dataset-specialist`
- `format`: UTF-8 JSONL, LlamaFactory Alpaca SFT
- `training_path`
- `validation_path`
- `test_path`
- `lineage_manifest_path`
- `dataset_info_path`
- `split_counts`
- `class_counts`
- `content_checksums`
- `schema_validation_result`
- `contamination_result`
- `readiness`: `READY`, `BLOCKED`

Training/evaluation record schema:

```json
{
  "instruction": "Classifique o sentimento do texto em exatamente uma palavra: positivo, neutro ou negativo.",
  "input": "<texto-fonte>",
  "output": "negativo|neutro|positivo"
}
```

Lineage sidecar fields per derived record:

- `derived_split`
- `derived_index`
- `source_split`
- `source_index`
- `source_exact_hash`
- `source_normalized_hash`
- `derived_record_hash`
- `transformation_version`

Validation rules:

- Training count must remain between 200 and 2,000.
- Final evaluation must contain at least 30 records per class.
- Exact and normalized overlap between training and test must be zero.
- Near-duplicate clusters crossing splits must be reviewed and resolved without changing source files.
- All derived records must pass LlamaFactory schema validation for the pinned version.

## EnvironmentProfile

Fields:

- `profile_id`
- `captured_at`
- `windows_edition`, `windows_version`, `build_revision`, `release_channel`
- `cpu_model`, `core_count`
- `gpu_model`, `pnp_id`, `driver_version`, `driver_date`, `driver_signature`
- `ram_total`, `ram_available`, `commit_limit`, `pagefile_policy`
- `disk_free`
- `power_state`, `power_plan`
- `python_version`, `python_architecture`
- `uv_version`
- `package_lock_hash`
- `package_versions`
- `torch_build`
- `xpu_available`, `xpu_device_count`, `xpu_name`
- `xpu_memory_observation`
- `synthetic_smoke_results`
- `readiness`: `READY`, `BLOCKED`

Validation rules:

- The training environment is isolated from the existing Python 3.14 `.venv`.
- All required packages resolve to stable binary Windows wheels; no source build or nightly dependency is allowed.
- `torch.xpu.is_available()` and all required synthetic forward/backward checks must pass for XPU readiness.
- CPU success never implies principal-run readiness.

## ExecutionProposal

Fields:

- `proposal_id`
- `spec_revision`
- `model_revision`
- `prepared_dataset_hash`
- `environment_profile_id`
- `llamafactory_revision`
- `method`
- `hyperparameters`
- `seed_policy`
- `prompt_hash`, `template_id`, `parser_version`
- `estimated_peak_memory`
- `estimated_duration`
- `output_path`
- `stop_conditions`
- `configuration_hash`
- `review_state`: `DRAFT`, `VALIDATED`, `REJECTED`, `AUTHORIZED`
- `authorized_at`, `authorized_by`

Validation rules:

- Creation is blocked until PreparedDataset and EnvironmentProfile are `READY`.
- Final method and hyperparameters are owned by `training-engineer`.
- Output path must not exist before authorization.
- Estimate plus safety margin must fit the 60-minute envelope.
- Any material field change clears authorization.

## ExperimentRun

Fields:

- `run_id`
- `proposal_id`
- `started_at`, `finished_at`
- `status`: `AUTHORIZED`, `RUNNING`, `COMPLETED`, `FAILED`, `STOPPED`
- `effective_configuration_hash`
- `environment_snapshot_hash`
- `logs_path`, `metrics_path`, `checkpoints_path`, `predictions_path`
- `peak_memory`
- `elapsed_time`
- `stop_reason`
- `deviations`

Validation rules:

- Only an `AUTHORIZED` proposal can create a run.
- Exactly one principal run is allowed by this plan.
- Run identity and output directory are unique and non-overwriting.
- Elapsed time cannot exceed 60 minutes without stop and failure evidence.

## EvaluationRecord

Fields:

- `evaluation_id`
- `run_id`
- `test_manifest_hash`
- `prompt_hash`, `template_id`, `parser_version`
- `base_predictions_hash`
- `adapted_predictions_hash`
- `base_accuracy`, `base_macro_f1`, `base_invalid_rate`
- `adapted_accuracy`, `adapted_macro_f1`, `adapted_invalid_rate`
- `threshold_branch`: `BASE_BELOW_0_80`, `BASE_AT_LEAST_0_80`
- `threshold_result`
- `regressions`
- `outcome`: `SUCCESSFUL`, `UNSUCCESSFUL`, `BLOCKED`

Validation rules:

- Base and adapted predictions use identical ordered examples and frozen generation/parsing settings.
- Adapted invalid-label rate must be 0% for success.
- If base macro-F1 <0.80, adapted macro-F1 must be at least base +0.10.
- If base macro-F1 ≥0.80, adapted macro-F1 must be at least base +0.02 and adapted accuracy must not be lower.
- All measurements and regressions are reported even when the experiment is unsuccessful.

## State Transitions

```text
SPEC_APPROVED
  → SOURCES_PROPOSED
  → SOURCES_APPROVED
  → ENVIRONMENT_VALIDATING
      → ENVIRONMENT_READY | BLOCKED
  → DATA_VALIDATING
      → DATA_READY | BLOCKED
  → STRATEGY_DRAFT
  → CONFIG_VALIDATED
  → OWNER_AUTHORIZED
  → RUNNING
      → COMPLETED | FAILED | STOPPED
  → EVALUATED
      → SUCCESSFUL | UNSUCCESSFUL
```

No transition may skip its preceding evidence. `BLOCKED` preserves reports and requires an explicit remediation or reviewed plan/spec change.
