# Implementation Plan: Resource-Efficient First Fine-Tuning Experiment

**Branch**: `feature/harness-completo` | **Feature ID**: `001-resource-efficient-finetune` | **Date**: 2026-08-21 | **Spec**: [spec.md](spec.md)

**Input**: Approved feature specification from `specs/001-resource-efficient-finetune/spec.md`

**Gate State**: G1-OP-V4 is complete and G2 is `READY`: the approved external CPython 3.12.12 environment has all 121 locked requirements plus pinned LLaMA-Factory; `uv pip check` and the synthetic XPU smoke suite pass. G2-OP is pending owner approval for the exact Qwen revision, Apache-2.0 use, external cache and 999,604,126-byte model retrieval estimate. Dataset, data preparation, inference, baseline, dry validation and training remain unauthorized.

## Summary

Prepare a reproducible, local-only Portuguese sentiment-classification experiment around the provisional pairing of `Qwen/Qwen2.5-0.5B-Instruct` at revision `7ae557604adf67be50417f59c2c2f167def9a775` and the `portuguese` configuration of `cardiffnlp/tweet_sentiment_multilingual` at repository commit `606156db529f327fd871515cccbe14dcbafef682`, the official commit that introduced the Portuguese source files.

The implementation follows the constitutional order: approve sources and environment plan; validate the immutable source dataset and produce a separate LLaMA-Factory-compatible derivative; only then allow the `training-engineer` to select LoRA settings, estimate memory and duration, validate the final configuration, and request explicit authorization. Native Windows XPU is the candidate execution path. CPU is diagnostic only unless a separate benchmark proves the 60-minute limit. No remote or paid fallback is permitted.

## Technical Context

**Language/Version**: CPython 3.12 x64 for the training environment; PowerShell for Windows orchestration. The existing project setting of Python 3.14 is not used for training because LlamaFactory v0.9.5 publishes tested classifiers only through Python 3.13.

**Primary Dependencies**: LlamaFactory v0.9.5 (`7af909522a951e3ad9f022ea6f88b6755257eaa5`); PyTorch XPU 2.9.1, torchvision XPU 0.24.1, torchaudio XPU 2.9.1; `omegaconf==2.0.6` as an experiment-level wheel-only compatibility candidate; compatible, locked releases of Transformers, Datasets, Accelerate, PEFT and TRL within LlamaFactory v0.9.5 constraints; scikit-learn for accuracy and macro-F1.

**Storage**: Versioned manifests, configuration proposals, validation reports and evaluation summaries under `experiments/001-resource-efficient-finetune/`. Non-versioned model cache, source data, derived data, environment cache, checkpoints and logs under `%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/`, with unique run identifiers and no overwrite.

**Testing**: Deterministic Python tests for schema conversion, label parsing, split isolation, hashing and metrics; LlamaFactory environment and schema checks; synthetic CPU/XPU runtime smoke tests; single-microbatch compatibility validation after data readiness; frozen baseline-versus-adapter evaluation.

**Target Platform**: Native Windows 11 x64 on Intel Core Ultra 7 258V with Intel Arc 140V integrated graphics. XPU is provisional until runtime tests pass. WSL2 is outside this plan and would require a reviewed plan change.

**Project Type**: Single-machine reproducible machine-learning experiment managed as versioned scripts, manifests, reports and configuration proposals around the existing fine-tuning harness.

**Performance Goals**: Principal training run completes within 60 elapsed minutes; zero paid compute; 100% valid labels on final evaluation; success threshold follows SC-008; all input, runtime and output identities are reproducible.

**Constraints**: Base model at most 1.5B parameters; 200–2,000 validated training records; primarily Portuguese inputs up to 280 Unicode characters; no source-data mutation; no model/data/checkpoint/cache versioning; no QLoRA assumption on Intel Arc; no silent CPU, WSL2, remote or paid fallback; no training before explicit authorization.

**Scale/Scope**: Candidate source currently reports 1,839 Portuguese training examples, 324 validation examples and 870 test examples, balanced across three classes. Actual counts, hashes, duplicates, privacy findings and suitability must be recalculated by the `dataset-specialist` from the pinned revision.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Pre-research evaluation

| Constitutional requirement | Evidence and decision |
|---|---|
| Spec Kit before implementation | PASS — `spec.md` and its quality checklist are approved at Gate G0. |
| Orchestrator coordinates transitions | PASS — the `orchestrator` reviewed G0 and coordinates source, data, strategy and execution gates. |
| Dataset specialist owns data | PASS BY DESIGN — no data has been retrieved or transformed; the planned next data action is delegated to `dataset-specialist`. |
| Dataset original remains immutable | PASS BY DESIGN — source cache is read-only; all preparation targets a separate derived location with lineage. |
| Training engineer owns strategy | PASS BY DESIGN — no final method, hyperparameters or LlamaFactory YAML is generated before a data-ready report. |
| Resource-aware execution | PASS BY DESIGN — a preliminary read-only Windows, CPU, RAM, GPU and disk inventory informed the plan; only the versioned G1 report reviewed by the orchestrator is gate evidence, and XPU, memory and duration remain mandatory empirical gates. |
| Reproducible experiment | PASS BY DESIGN — immutable revisions, locked dependencies, seed policy, manifests, logs, metrics and unique outputs are required. |
| LLaMA-Factory is canonical | PASS — all supported tuning, evaluation and inference activities are planned through LlamaFactory v0.9.5. |
| License, privacy and sensitive data | PENDING EXECUTION GATE — sources are documented; dataset use remains blocked pending explicit acceptance of CC BY 3.0 plus X/Twitter terms and a privacy scan. |
| Explicit training authorization | CLOSED — G0 approval authorizes planning only; no training permission exists. |

No constitutional exception or justified violation is present. Pending gates restrict later execution but do not block creation of the plan.

### Post-design re-check

Phase 1 preserves the same ordering and adds explicit entity states, immutable paths, validation evidence and stop conditions. Source approval, data readiness, environment compatibility, strategy review, configuration validation and execution authorization remain separate transitions. **Result: PASS for planning; implementation and training gates remain closed.**

## Phase 0: Research Decisions

The complete evidence, rationale and alternatives are recorded in [research.md](research.md). Key decisions are:

1. Propose Qwen2.5-0.5B-Instruct because it has 0.49B parameters, explicit Portuguese support, Apache-2.0 licensing and official LlamaFactory family support.
2. Propose Cardiff NLP's Portuguese Tweet Sentiment dataset because its native three labels, short texts, balanced original splits and 1,839-example training split match the approved scope.
3. Require an explicit owner decision on CC BY 3.0 plus current X/Twitter restrictions before dataset retrieval.
4. Build a separate Python 3.12 environment; never retrofit the current Python 3.14 `.venv` in place.
5. Use stable Windows XPU wheels as the candidate runtime and require synthetic XPU verification before retrieving model weights.
6. Keep LoRA SFT only as a provisional direction. The `training-engineer` chooses and justifies the final strategy after the dataset is declared ready.
7. Preserve the original validation and test splits. Use validation only for development decisions and freeze test for final baseline-versus-adapter comparison.
8. Evaluate `omegaconf==2.0.6` through a new metadata-only lock because the unpinned latest release selected by the first resolver introduced a source-only CPython 3.12/Windows dependency. Treat the pin as provisional until G2 runtime validation passes.
9. Resolve the Windows XPU wheel's platform-specific Intel/oneMKL dependencies from its installed wheel metadata and official package metadata before declaring G1-OP complete.

## Phase 1: Design

### Data design

The entity definitions, schemas, relationships and state transitions are in [data-model.md](data-model.md). The derived training format is LlamaFactory Alpaca-style SFT with a fixed instruction, source text as input and exactly one Portuguese label as output. Lineage and validation evidence live in sidecar manifests rather than being learned by the model.

### Interfaces

No public API, service, user interface or reusable external library is introduced. A `contracts/` directory is intentionally omitted. Internal command-line entry points and their expected evidence are described by the quickstart and will be implemented as project scripts after plan approval.

### Validation guide

[quickstart.md](quickstart.md) defines the gated validation sequence. It deliberately omits an executable training command until the data, environment, strategy, configuration and authorization gates have all passed.

## Project Structure

### Documentation for this feature

```text
specs/001-resource-efficient-finetune/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
└── tasks.md                  # created only by speckit-tasks after plan approval
```

### Planned versioned experiment assets

```text
experiments/001-resource-efficient-finetune/
├── configs/                  # reviewed proposals; never secrets or downloaded weights
├── manifests/                # immutable source IDs, hashes, versions and run identity
├── reports/                  # data, environment, readiness and evaluation reports
├── scripts/                  # deterministic validation, conversion and evaluation entry points
└── tests/                    # schema, lineage, split, parsing and metric tests
```

### Planned non-versioned local assets

```text
%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/
├── environments/
├── cache/
│   ├── model/
│   └── dataset-source/
├── data-derived/
└── runs/
    └── <unique-run-id>/
        ├── checkpoints/
        ├── logs/
        ├── metrics/
        └── predictions/
```

**Structure Decision**: Keep governance and reproducibility evidence in the repository while all third-party content and generated heavy artifacts remain outside it. The implementation must add explicit ignore/protection checks before any local asset is created and must reject an existing run identifier.

## Gate Sequence After Plan Approval

| Gate | Required evidence | Owner | Transition |
|---|---|---|---|
| G0-B — plan and source decision | Exact model/dataset revisions, licenses, terms and documented risks are reviewed | Orchestrator + experiment owner | Approves the approach and candidates only; allows requests for separate operational authorizations |
| G0-C — non-operational implementation | Owner approves versioned scaffolding, guardrails and read-only inspections while explicitly excluding installation, retrieval, data preparation, inference, dry validation and training | Experiment owner | Allows implementation through the G1 read-only review only |
| G1-METADATA-2 remediation — dependency candidate | Owner-approved metadata-only review of the explicit OmegaConf override, with wheel/hash/size and transitive graph evidence | Orchestrator | Allows formulation of a revised G1-OP proposal only; does not authorize installation |
| G1 — environment identity | Complete read-only Windows build/channel, driver, Python, uv, RAM/commit and storage record | Orchestrator | Allows owner review of the dependency-installation proposal |
| G1-OP — dependency installation authorization | Owner explicitly approves the exact environment location, package set, network access and expected disk impact | Experiment owner | Allows creation of the isolated environment and dependency installation |
| G2 — dependency/runtime | Locked stable wheels, clean dependency check, LlamaFactory environment report, XPU synthetic smoke tests | Orchestrator | Allows owner review of the model-retrieval proposal |
| G2-OP — model retrieval authorization | Owner explicitly approves the exact model revision, license, local cache location and expected download size | Experiment owner | Allows retrieval of model files and real compatibility tests |
| G3 — data compliance and retrieval authorization | Dataset terms accepted; approved non-versioned location and explicit owner authorization for the exact immutable source | Owner + dataset-specialist | Allows source retrieval |
| G4 — data readiness | Immutable source hash, complete validation, derived schema and formal `READY` report | dataset-specialist | Allows training strategy work |
| G5 — strategy and feasibility | Final method, hyperparameters, memory estimate, timed projection and proposed LlamaFactory configuration | training-engineer | Allows orchestrator review |
| G6 — review, then dry validation | Orchestrator first confirms license/privacy consistency, no-overwrite protection and config/schema validity; only after that approval, the training-engineer performs the microbatch dry validation | Orchestrator, then training-engineer | Allows authorization request |
| G7 — explicit authorization | Owner approves the exact run identity and reviewed configuration | Experiment owner | Allows one principal run |
| G8 — result | Preserved logs/checkpoints/metrics and frozen baseline comparison | Orchestrator | Closes experiment |

Any material change defined in FR-011 returns to the applicable earlier artifact and gate.

## Complexity Tracking

No constitutional violations require justification.
