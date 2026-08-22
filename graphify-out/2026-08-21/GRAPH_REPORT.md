# Graph Report - alura-llama-factory  (2026-08-21)

## Corpus Check
- Corpus is ~31,203 words - fits in a single context window. You may not need a graph.

## Summary
- 94 nodes · 140 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.89)
- Token cost: 5,854 input · 8,136 output

## Community Hubs (Navigation)
- Fine-Tuning Governance Harness
- Spec Kit Delivery Workflow
- Spec Kit PowerShell Core
- Fine-Tuning Strategy Runtime
- Requirements Quality Workflow
- Feature Branch Creation
- Constitutional Governance
- Project Package Metadata
- Project Documentation

## God Nodes (most connected - your core abstractions)
1. `LLaMA-Factory` - 14 edges
2. `Training Engineer` - 10 edges
3. `Fine-Tuning Harness` - 10 edges
4. `Fine-Tuning Strategy` - 9 edges
5. `Dataset Specialist` - 9 edges
6. `Orchestrator` - 9 edges
7. `Alura LLaMA-Factory Constitution` - 8 edges
8. `Dataset Validation` - 7 edges
9. `Dataset Preparation` - 6 edges
10. `Fine-Tuning Quality Gate Flow` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Spec Kit Before Implementation` --conceptually_related_to--> `Spec Kit Source of Truth`  [INFERRED]
  .specify/memory/constitution.md → AGENTS.md
- `Orchestration and Specialized Skills` --references--> `Fine-Tuning Strategy`  [EXTRACTED]
  .specify/memory/constitution.md → .agents/skills/fine-tuning-strategy/SKILL.md
- `Fine-Tuning Harness` --references--> `Fine-Tuning Strategy`  [EXTRACTED]
  AGENTS.md → .agents/skills/fine-tuning-strategy/SKILL.md
- `Dataset Specialist` --references--> `LLaMA-Factory`  [EXTRACTED]
  .codex/agents/dataset-specialist.md → .agents/skills/llama-factory/SKILL.md
- `Orchestrator` --references--> `LLaMA-Factory`  [EXTRACTED]
  .codex/agents/orchestrator.md → .agents/skills/llama-factory/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Spec Kit to LLaMA-Factory Pipeline** — agents_spec_kit_source_of_truth, _codex_agents_orchestrator_orchestrator, _codex_agents_dataset_specialist_dataset_specialist, _codex_agents_training_engineer_training_engineer, _agents_skills_dataset_preparation_skill_dataset_preparation, _agents_skills_fine_tuning_strategy_skill_fine_tuning_strategy, _agents_skills_llama_factory_skill_llama_factory [EXTRACTED 1.00]
- **Constitutional Fine-Tuning Quality Gates** — _specify_memory_constitution_quality_gate_flow, _codex_agents_orchestrator_orchestrator, _codex_agents_dataset_specialist_dataset_specialist, _agents_skills_dataset_preparation_skill_dataset_validation, _codex_agents_training_engineer_training_engineer, _agents_skills_llama_factory_skill_training_configuration_validation [EXTRACTED 1.00]
- **Reproducible Experiment Controls** — _specify_memory_constitution_reproducible_registered_experiments, _agents_skills_dataset_preparation_skill_transformation_audit_trail, _agents_skills_llama_factory_skill_reproducible_configuration, _agents_skills_llama_factory_skill_checkpoint_preservation, _codex_agents_training_engineer_training_engineer, _codex_agents_orchestrator_orchestrator [INFERRED 0.95]
- **Full Specify Plan Tasks Implement Cycle** — _agents_skills_speckit_specify_skill_speckit_specify, _agents_skills_speckit_plan_skill_speckit_plan, _agents_skills_speckit_tasks_skill_speckit_tasks, _agents_skills_speckit_implement_skill_speckit_implement [EXTRACTED 1.00]
- **Core Spec Kit Artifact Chain** — _specify_templates_spec_template_feature_specification_template, _specify_templates_plan_template_implementation_plan_template, _specify_templates_tasks_template_task_list_template [INFERRED 0.95]
- **Requirements Quality and Governance Loop** — _agents_skills_speckit_constitution_skill_speckit_constitution, _agents_skills_speckit_specify_skill_speckit_specify, _agents_skills_speckit_clarify_skill_speckit_clarify, _agents_skills_speckit_checklist_skill_speckit_checklist, _agents_skills_speckit_analyze_skill_speckit_analyze [INFERRED 0.75]

## Communities (13 total, 3 thin omitted)

### Community 0 - "Fine-Tuning Governance Harness"
Cohesion: 0.18
Nodes (23): Dataset Preparation, Dataset Validation, Original Dataset Immutability, Transformation Audit Trail, Training Configuration Validation, Dataset Readiness Report, Dataset Specialist, Orchestrator (+15 more)

### Community 1 - "Spec Kit Delivery Workflow"
Cohesion: 0.12
Nodes (20): Cross-Artifact Consistency Analysis, Speckit Analyze, Append-Only Gap Closure, Speckit Converge, Dependency-Ordered Task Execution, Speckit Implement, Research-Then-Design Planning, Speckit Plan (+12 more)

### Community 2 - "Spec Kit PowerShell Core"
Cohesion: 0.23
Nodes (13): Find-SpecifyRoot(), Format-SpecKitCommand(), Get-CurrentBranch(), Get-FeaturePathsEnv(), Get-InvokeSeparator(), Get-NormalizedPriority(), Get-Python3Command(), Get-RepoRoot() (+5 more)

### Community 3 - "Fine-Tuning Strategy Runtime"
Cohesion: 0.25
Nodes (11): Fine-Tuning Strategy, LoRA, QLoRA, Resource-Aware Hyperparameter Selection, Supervised Fine-Tuning, Validated Dataset Prerequisite, Checkpoint Preservation, LLaMA-Factory (+3 more)

### Community 4 - "Requirements Quality Workflow"
Cohesion: 0.29
Nodes (8): Speckit Checklist, Unit Tests for Requirements Writing, Incremental Spec Clarification, Speckit Clarify, Speckit Specify, Technology-Agnostic Feature Specification, Custom Checklist Template, Reviewer-Owned Marker Semantics

### Community 6 - "Constitutional Governance"
Cohesion: 0.50
Nodes (4): Semantic-Versioned Governance, Speckit Constitution, Core Principles and Governance, Project Constitution Template

## Knowledge Gaps
- **7 isolated node(s):** `alura-llama-factory`, `Dataset Readiness Report`, `Constitution Governance`, `Graphify Knowledge Graph`, `Dependency-Ordered Task Execution` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LLaMA-Factory` connect `Fine-Tuning Strategy Runtime` to `Fine-Tuning Governance Harness`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `Speckit Specify` connect `Requirements Quality Workflow` to `Spec Kit Delivery Workflow`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Full SDD Cycle Workflow` connect `Spec Kit Delivery Workflow` to `Requirements Quality Workflow`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `alura-llama-factory`, `Dataset Readiness Report`, `Constitution Governance` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Spec Kit Delivery Workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.12105263157894737 - nodes in this community are weakly interconnected._