# Graph Report - harness-llama-factory  (2026-08-23)

## Corpus Check
- 159 files · ~226,361 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 786 nodes · 1311 edges · 66 communities (48 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dc90d20c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LLaMA-Factory
- Speckit Analyze
- common.ps1
- caminho
- required
- create-new-feature.ps1
- Speckit Constitution
- alura-llama-factory
- Research: Resource-Efficient First Fine-Tuning Experiment
- Data Model: Resource-Efficient First Fine-Tuning Experiment
- Tasks: Resource-Efficient First Fine-Tuning Experiment
- original/README.md
- G4 remediation — derived dataset review
- main
- validate_heavy_artifact_path
- fetch_model_source.py
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
- Implementation Plan: Resource-Efficient First Fine-Tuning Experiment
- runtime_smoke.py
- RuntimeValidationScriptTests
- ModelRetrievalTests
- Revisão de conformidade de dados — G3
- fetch_dataset_source.ps1
- prepare_dataset.py
- G4 — Data readiness report
- validate_model_compatibility.py
- required
- validate_dataset.py
- G5 — Estratégia e viabilidade
- G4-DERIVED — Data readiness decision
- G6 — Configuration and governance review
- G7 — Principal run result
- evaluate_frozen_set.py
- MetricsTests
- load_evaluator
- G8 — Final evaluation
- ReproducibilityTests
- LlamaFactoryCompatibilityTests
- ExecutionProposalTests
- RunGuardTests
- Traceability and closure report
- Quickstart validation
- Repository safety scan
- graphify-update.md
- Os 11 passos

## God Nodes (most connected - your core abstractions)
1. `main()` - 27 edges
2. `caminho()` - 25 edges
3. `escrever_json_sem_sobrescrever()` - 22 edges
4. `ler_jsonl()` - 16 edges
5. `SourceRow` - 14 edges
6. `LLaMA-Factory` - 14 edges
7. `required` - 13 edges
8. `validate_gate_document()` - 13 edges
9. `escrever_jsonl()` - 12 edges
10. `main()` - 12 edges

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

## Communities (66 total, 18 thin omitted)

### Community 0 - "LLaMA-Factory"
Cohesion: 0.12
Nodes (34): Dataset Preparation, Dataset Validation, Original Dataset Immutability, Transformation Audit Trail, Fine-Tuning Strategy, LoRA, QLoRA, Resource-Aware Hyperparameter Selection (+26 more)

### Community 1 - "Speckit Analyze"
Cohesion: 0.09
Nodes (28): Cross-Artifact Consistency Analysis, Speckit Analyze, Speckit Checklist, Unit Tests for Requirements Writing, Incremental Spec Clarification, Speckit Clarify, Append-Only Gap Closure, Speckit Converge (+20 more)

### Community 2 - "common.ps1"
Cohesion: 0.23
Nodes (13): Find-SpecifyRoot(), Format-SpecKitCommand(), Get-CurrentBranch(), Get-FeaturePathsEnv(), Get-InvokeSeparator(), Get-NormalizedPriority(), Get-Python3Command(), Get-RepoRoot() (+5 more)

### Community 3 - "caminho"
Cohesion: 0.12
Nodes (39): main(), Passo 1: observa o dataset sem alterar o arquivo original., main(), Passo 2: confirma a estrutura mínima do CSV original., main(), Passo 3: transforma cada linha no formato didático instrução/contexto/resposta., main(), Passo 4: limpa espaços e normaliza o texto, preservando rejeitados. (+31 more)

### Community 4 - "required"
Cohesion: 0.09
Nodes (26): required, definitions, datasetSource, executionProposal, experimentRun, modelSource, required, required (+18 more)

### Community 6 - "Speckit Constitution"
Cohesion: 0.50
Nodes (4): Semantic-Versioned Governance, Speckit Constitution, Core Principles and Governance, Project Constitution Template

### Community 8 - "Research: Resource-Efficient First Fine-Tuning Experiment"
Cohesion: 0.11
Nodes (16): G2-OP completion, G2-OP request, Proposed model payload — metadata only, Runtime evidence, Runtime G2 Review, Decision 1 — Base model candidate, Decision 2 — Dataset candidate, Decision 3 — LlamaFactory revision (+8 more)

### Community 13 - "Data Model: Resource-Efficient First Fine-Tuning Experiment"
Cohesion: 0.04
Nodes (44): Content Quality, Feature Readiness, Notes, Requirement Completeness, Specification Quality Checklist: Resource-Efficient First Fine-Tuning Experiment, Data Model: Resource-Efficient First Fine-Tuning Experiment, DatasetSource, Entity Overview (+36 more)

### Community 14 - "Tasks: Resource-Efficient First Fine-Tuning Experiment"
Cohesion: 0.08
Nodes (23): Authorized MVP Tranche, Dependencies & Execution Order, Gate Discipline, Gated operational implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation for User Story 4, Implementation Strategy (+15 more)

### Community 16 - "G4 remediation — derived dataset review"
Cohesion: 0.22
Nodes (8): Counts before and after, Duplicate resolution, G4 remediation — derived dataset review, Limits, Redactions, Scope and authorization, Transformation criteria, Validation and decision

### Community 17 - "main"
Cohesion: 0.35
Nodes (13): encode_messages(), external_root(), load_json(), macro_f1(), main(), Any, Path, G6 representative microbatch and frozen-baseline validation. This is… (+5 more)

### Community 18 - "validate_heavy_artifact_path"
Cohesion: 0.24
Nodes (11): approved_root_from_environment(), _is_within(), _normalized(), PathPolicyError, Path, ValueError, Path protections for heavy and generated experiment artifacts., Raised when an artifact path violates experiment policy. (+3 more)

### Community 19 - "fetch_model_source.py"
Cohesion: 0.12
Nodes (26): AllowlistedRedirectHandler, download_file(), load_gate(), main(), Any, Path, RuntimeError, Retrieve one pinned model revision with fail-closed metadata, size and hash… (+18 more)

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

### Community 35 - "Implementation Plan: Resource-Efficient First Fine-Tuning Experiment"
Cohesion: 0.12
Nodes (17): Complexity Tracking, Constitution Check, Data design, Documentation for this feature, Gate Sequence After Plan Approval, Implementation Plan: Resource-Efficient First Fine-Tuning Experiment, Interfaces, Phase 0: Research Decisions (+9 more)

### Community 36 - "runtime_smoke.py"
Cohesion: 0.53
Nodes (5): cpu_probe(), identity(), main(), Read-only runtime smoke probes for the G2 environment gate., xpu_probe()

### Community 40 - "Revisão de conformidade de dados — G3"
Cohesion: 0.18
Nodes (10): Caminho externo aprovado e utilizado, Decisão e escopo autorizado do G3, Decisão para o Orchestrator, Licença CC BY 3.0, Origem e revisão proposta, Resultado da recuperação autorizada, Revisão de conformidade de dados — G3, Riscos de privacidade e conteúdo sensível (+2 more)

### Community 41 - "fetch_dataset_source.ps1"
Cohesion: 0.62
Nodes (5): Assert-AllowedUri(), Get-G3File(), Get-RedirectUri(), Invoke-G3GetText(), Stop-G3()

### Community 42 - "prepare_dataset.py"
Cohesion: 0.15
Nodes (33): Counter, assess_language(), build_derived_record(), canonical_json(), duplicate_pair_summary(), expected_scope_hash(), jsonl_bytes(), lineage_record() (+25 more)

### Community 43 - "G4 — Data readiness report"
Cohesion: 0.29
Nodes (6): Dataset-specialist review, Decision basis, G4 — Data readiness report, Quantified findings, Reproducibility and limitations, Source identity

### Community 44 - "validate_model_compatibility.py"
Cohesion: 0.27
Nodes (21): canonical_json(), check_file_hash(), is_within(), load_json(), main(), path_is_external(), Any, Path (+13 more)

### Community 45 - "required"
Cohesion: 0.04
Nodes (49): type, items, type, uniqueItems, enum, environmentProfile, gateDecision, properties (+41 more)

### Community 46 - "validate_dataset.py"
Cohesion: 0.14
Nodes (25): assess_language(), classify_content(), expected_files(), load_manifest(), main(), normalize_text(), overlap_counts(), parse_args() (+17 more)

### Community 47 - "G5 — Estratégia e viabilidade"
Cohesion: 0.15
Nodes (12): Dataset validado usado na proposta, Estratégia proposta, G5 — Estratégia e viabilidade, Hardware e runtime observados, Hiperparâmetros completos e justificativas, Limitações e próximos gates, Memória, duração e envelope, Modelo base (+4 more)

### Community 48 - "G4-DERIVED — Data readiness decision"
Cohesion: 0.40
Nodes (4): Decision boundary, G4-DERIVED — Data readiness decision, Identity and storage, Readiness evidence

### Community 49 - "G6 — Configuration and governance review"
Cohesion: 0.33
Nodes (5): Authorization boundary, G6 — Configuration and governance review, Hashes reviewed, Review checks, Reviewed identity

### Community 50 - "G7 — Principal run result"
Cohesion: 0.40
Nodes (4): Cause, G7 — Principal run result, Next decision, Preserved result

### Community 52 - "evaluate_frozen_set.py"
Cohesion: 0.31
Nodes (14): encode_prompt(), evaluate(), external_root(), macro_f1(), main(), parse_prediction(), Any, Path (+6 more)

### Community 55 - "G8 — Final evaluation"
Cohesion: 0.50
Nodes (3): Frozen comparison, G8 — Final evaluation, Reproducibility and scope

### Community 61 - "Traceability and closure report"
Cohesion: 0.40
Nodes (4): Closure decision, Functional requirements, Success criteria, Traceability and closure report

### Community 62 - "Quickstart validation"
Cohesion: 0.50
Nodes (3): Applicable validations, Protected commands not repeated, Quickstart validation

### Community 65 - "Os 11 passos"
Cohesion: 0.09
Nodes (20): 10. Converter para o formato do LLaMA-Factory, 11. Validar o dataset final, 1. Criar, selecionar ou importar o dataset, 2. Definir o schema dos exemplos, 3. Organizar instrução, contexto e resposta, 4. Limpar e normalizar os dados, 5. Remover duplicidades e exemplos inconsistentes, 6. Verificar dados sensíveis, incorretos ou fora do domínio (+12 more)

## Knowledge Gaps
- **223 isolated node(s):** `$schema`, `gate_id`, `decision`, `approved_at`, `scope_hash` (+218 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `validate_gate_document()` connect `validate_gate_document` to `prepare_dataset.py`, `resolve_package_metadata.py`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `load_authorization_gate()` connect `resolve_package_metadata.py` to `validate_gate_document`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `main()` connect `prepare_dataset.py` to `validate_gate_document`, `validate_dataset.py`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `Counter` (e.g. with `main()` and `main()`) actually correct?**
  _`Counter` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `gate_id`, `decision` to the rest of the system?**
  _223 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LLaMA-Factory` be split into smaller, more focused modules?**
  _Cohesion score 0.12477718360071301 - nodes in this community are weakly interconnected._
- **Should `Speckit Analyze` be split into smaller, more focused modules?**
  _Cohesion score 0.08994708994708994 - nodes in this community are weakly interconnected._