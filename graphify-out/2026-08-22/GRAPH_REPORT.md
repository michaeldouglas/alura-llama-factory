# Graph Report - alura-llama-factory  (2026-08-22)

## Corpus Check
- 83 files · ~196,427 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 428 nodes · 594 edges · 36 communities (28 shown, 8 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6f79d9fc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LLaMA-Factory
- Speckit Analyze
- common.ps1
- properties
- required
- create-new-feature.ps1
- Speckit Constitution
- alura-llama-factory
- Project README
- Quickstart Validation Guide: Resource-Efficient First Fine-Tuning Experiment
- Tasks: Resource-Efficient First Fine-Tuning Experiment
- Feature Specification: Resource-Efficient First Fine-Tuning Experiment
- required
- Data Model: Resource-Efficient First Fine-Tuning Experiment
- validate_heavy_artifact_path
- manifest_utils.py
- validate_gate_document
- resolve_package_metadata.py
- Environment G1 Review
- Resource-Efficient First Fine-Tuning Experiment
- RuntimeResolutionTests
- EnvironmentProfileTests
- stop-conditions.md
- __init__.py
- Runtime Metadata Review — G1-METADATA-2 Remediation
- Runtime Metadata Review — T073
- Runtime Metadata Review — G1-METADATA-2
- G1-OP Partial Installation Review
- create_environment.ps1
- Research: Resource-Efficient First Fine-Tuning Experiment

## God Nodes (most connected - your core abstractions)
1. `LLaMA-Factory` - 14 edges
2. `required` - 13 edges
3. `MetadataClient` - 12 edges
4. `Data Model: Resource-Efficient First Fine-Tuning Experiment` - 12 edges
5. `Tasks: Resource-Efficient First Fine-Tuning Experiment` - 12 edges
6. `resolve_requirement()` - 11 edges
7. `validate_gate_document()` - 11 edges
8. `Quickstart Validation Guide: Resource-Efficient First Fine-Tuning Experiment` - 11 edges
9. `Research: Resource-Efficient First Fine-Tuning Experiment` - 11 edges
10. `validate_heavy_artifact_path()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Spec Kit Before Implementation` --conceptually_related_to--> `Spec Kit Source of Truth`  [INFERRED]
  .specify/memory/constitution.md → AGENTS.md
- `Speckit Analyze` --references--> `Implementation Plan Template`  [INFERRED]
  .agents/skills/speckit-analyze/SKILL.md → .specify/templates/plan-template.md
- `Speckit Analyze` --references--> `Feature Specification Template`  [INFERRED]
  .agents/skills/speckit-analyze/SKILL.md → .specify/templates/spec-template.md
- `Speckit Analyze` --references--> `Task List Template`  [INFERRED]
  .agents/skills/speckit-analyze/SKILL.md → .specify/templates/tasks-template.md
- `Speckit Implement` --references--> `Task List Template`  [INFERRED]
  .agents/skills/speckit-implement/SKILL.md → .specify/templates/tasks-template.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Constitutional Fine-Tuning Quality Gates** — _specify_memory_constitution_quality_gate_flow, _codex_agents_orchestrator_orchestrator, _codex_agents_dataset_specialist_dataset_specialist, _agents_skills_dataset_preparation_skill_dataset_validation, _codex_agents_training_engineer_training_engineer, _agents_skills_llama_factory_skill_training_configuration_validation [EXTRACTED 1.00]
- **Spec Kit to LLaMA-Factory Pipeline** — agents_spec_kit_source_of_truth, _codex_agents_orchestrator_orchestrator, _codex_agents_dataset_specialist_dataset_specialist, _codex_agents_training_engineer_training_engineer, _agents_skills_dataset_preparation_skill_dataset_preparation, _agents_skills_fine_tuning_strategy_skill_fine_tuning_strategy, _agents_skills_llama_factory_skill_llama_factory [EXTRACTED 1.00]
- **Full Specify Plan Tasks Implement Cycle** — _agents_skills_speckit_specify_skill_speckit_specify, _agents_skills_speckit_plan_skill_speckit_plan, _agents_skills_speckit_tasks_skill_speckit_tasks, _agents_skills_speckit_implement_skill_speckit_implement [EXTRACTED 1.00]
- **Requirements Quality and Governance Loop** — _agents_skills_speckit_constitution_skill_speckit_constitution, _agents_skills_speckit_specify_skill_speckit_specify, _agents_skills_speckit_clarify_skill_speckit_clarify, _agents_skills_speckit_checklist_skill_speckit_checklist, _agents_skills_speckit_analyze_skill_speckit_analyze [INFERRED 0.75]
- **Core Spec Kit Artifact Chain** — _specify_templates_spec_template_feature_specification_template, _specify_templates_plan_template_implementation_plan_template, _specify_templates_tasks_template_task_list_template [INFERRED 0.95]
- **Reproducible Experiment Controls** — _specify_memory_constitution_reproducible_registered_experiments, _agents_skills_dataset_preparation_skill_transformation_audit_trail, _agents_skills_llama_factory_skill_reproducible_configuration, _agents_skills_llama_factory_skill_checkpoint_preservation, _codex_agents_training_engineer_training_engineer, _codex_agents_orchestrator_orchestrator [INFERRED 0.95]

## Communities (36 total, 8 thin omitted)

### Community 0 - "LLaMA-Factory"
Cohesion: 0.12
Nodes (34): Dataset Preparation, Dataset Validation, Original Dataset Immutability, Transformation Audit Trail, Fine-Tuning Strategy, LoRA, QLoRA, Resource-Aware Hyperparameter Selection (+26 more)

### Community 1 - "Speckit Analyze"
Cohesion: 0.09
Nodes (28): Cross-Artifact Consistency Analysis, Speckit Analyze, Speckit Checklist, Unit Tests for Requirements Writing, Incremental Spec Clarification, Speckit Clarify, Append-Only Gap Closure, Speckit Converge (+20 more)

### Community 2 - "common.ps1"
Cohesion: 0.23
Nodes (13): Find-SpecifyRoot(), Format-SpecKitCommand(), Get-CurrentBranch(), Get-FeaturePathsEnv(), Get-InvokeSeparator(), Get-NormalizedPriority(), Get-Python3Command(), Get-RepoRoot() (+5 more)

### Community 3 - "properties"
Cohesion: 0.07
Nodes (29): type, items, type, uniqueItems, enum, gateDecision, type, properties (+21 more)

### Community 4 - "required"
Cohesion: 0.09
Nodes (26): required, definitions, datasetSource, executionProposal, experimentRun, modelSource, required, required (+18 more)

### Community 6 - "Speckit Constitution"
Cohesion: 0.50
Nodes (4): Semantic-Versioned Governance, Speckit Constitution, Core Principles and Governance, Project Constitution Template

### Community 13 - "Quickstart Validation Guide: Resource-Efficient First Fine-Tuning Experiment"
Cohesion: 0.18
Nodes (11): 1. Confirm source-of-truth artifacts, 2. Gate G0-B — owner reviews sources and terms, 2A. Gate G0-C — non-operational implementation, 3. Gates G1, G1-OP, G2 and G2-OP — environment validation, 4. Gate G3/G4 — dataset compliance and readiness, 5. Gate G5 — strategy and feasibility, 6. Gate G6 — frozen baseline and configuration review, 7. Gate G7 — explicit training authorization (+3 more)

### Community 14 - "Tasks: Resource-Efficient First Fine-Tuning Experiment"
Cohesion: 0.08
Nodes (23): Authorized MVP Tranche, Dependencies & Execution Order, Gate Discipline, Gated operational implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation for User Story 4, Implementation Strategy (+15 more)

### Community 15 - "Feature Specification: Resource-Efficient First Fine-Tuning Experiment"
Cohesion: 0.09
Nodes (21): Content Quality, Feature Readiness, Notes, Requirement Completeness, Specification Quality Checklist: Resource-Efficient First Fine-Tuning Experiment, Approved Runtime Remediation, Assumptions, Classification Policy (+13 more)

### Community 16 - "required"
Cohesion: 0.10
Nodes (20): environmentProfile, properties, required, const, const, inspection_mode, operational_actions_performed, readiness (+12 more)

### Community 17 - "Data Model: Resource-Efficient First Fine-Tuning Experiment"
Cohesion: 0.06
Nodes (29): Data Model: Resource-Efficient First Fine-Tuning Experiment, DatasetSource, Entity Overview, EnvironmentProfile, EvaluationRecord, ExecutionProposal, ExperimentRun, ExperimentSpecification (+21 more)

### Community 18 - "validate_heavy_artifact_path"
Cohesion: 0.24
Nodes (11): approved_root_from_environment(), _is_within(), _normalized(), PathPolicyError, Path, ValueError, Path protections for heavy and generated experiment artifacts., Raised when an artifact path violates experiment policy. (+3 more)

### Community 19 - "manifest_utils.py"
Cohesion: 0.24
Nodes (11): canonical_json(), Any, Path, Deterministic manifest helpers with no implicit overwrite., Return stable UTF-8 JSON text suitable for hashing., Create a JSON manifest atomically enough for a single local process; never…, sha256_bytes(), sha256_file() (+3 more)

### Community 20 - "validate_gate_document"
Cohesion: 0.22
Nodes (9): GateValidationError, Any, Path, ValueError, Fail-closed validation for experiment gate records., Raised when authorization is absent, stale or too narrow., validate_gate_document(), validate_gate_file() (+1 more)

### Community 21 - "resolve_package_metadata.py"
Cohesion: 0.10
Nodes (40): applicable_requirements(), build_lock(), choose_wheel(), _combined_requirement(), find_xpu_wheel(), highest_release(), _int_or_none(), load_authorization_gate() (+32 more)

### Community 22 - "Environment G1 Review"
Cohesion: 0.29
Nodes (6): Assessment, Closed Gates, Environment G1 Review, Evidence, Missing Read-Only Details, Next Decision Required

### Community 23 - "Resource-Efficient First Fine-Tuning Experiment"
Cohesion: 0.40
Nodes (4): Current authorization, Non-versioned layout, Resource-Efficient First Fine-Tuning Experiment, Versioned layout

### Community 30 - "Runtime Metadata Review — G1-METADATA-2 Remediation"
Cohesion: 0.33
Nodes (5): Assessment, Evidence, G1-OP proposal boundary, Runtime Metadata Review — G1-METADATA-2 Remediation, Scope

### Community 31 - "Runtime Metadata Review — T073"
Cohesion: 0.33
Nodes (5): Decision Rationale, Evidence, Explicitly Prohibited, Next Request, Runtime Metadata Review — T073

### Community 32 - "Runtime Metadata Review — G1-METADATA-2"
Cohesion: 0.33
Nodes (5): Blocking finding, Decision and next action, Resolution evidence, Runtime Metadata Review — G1-METADATA-2, Scope and execution

### Community 33 - "G1-OP Partial Installation Review"
Cohesion: 0.33
Nodes (5): Blocking finding, Evidence, G1-OP Partial Installation Review, Required decision, Superseded outcome after G1-OP-V4 approval

### Community 35 - "Research: Resource-Efficient First Fine-Tuning Experiment"
Cohesion: 0.18
Nodes (11): Decision 1 — Base model candidate, Decision 2 — Dataset candidate, Decision 3 — LlamaFactory revision, Decision 4 — Python and dependency runtime, Decision 5 — Hardware execution route, Decision 6 — Data preparation format, Decision 7 — Evaluation design, Decision 8 — Provisional fine-tuning direction (+3 more)

## Knowledge Gaps
- **152 isolated node(s):** `$schema`, `gate_id`, `decision`, `approved_at`, `scope_hash` (+147 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `definitions` connect `required` to `required`, `properties`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `environmentProfile` connect `required` to `required`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `load_authorization_gate()` connect `resolve_package_metadata.py` to `validate_gate_document`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `$schema`, `gate_id`, `decision` to the rest of the system?**
  _152 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LLaMA-Factory` be split into smaller, more focused modules?**
  _Cohesion score 0.12477718360071301 - nodes in this community are weakly interconnected._
- **Should `Speckit Analyze` be split into smaller, more focused modules?**
  _Cohesion score 0.08994708994708994 - nodes in this community are weakly interconnected._
- **Should `properties` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._