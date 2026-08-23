## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

# Harness de Fine-Tuning

Este projeto utiliza um harness especializado em fine-tuning de modelos com LLaMA-Factory.

## Fluxo

O fluxo principal do projeto é:

Spec Kit → Orchestrator → Agentes especializados → Skills → LLaMA-Factory.

## Agentes

- `orchestrator`: coordena o fluxo de trabalho.
- `dataset-specialist`: analisa, valida e prepara datasets.
- `training-engineer`: define e executa estratégias de fine-tuning.

## Skills

Utilize as skills especializadas quando aplicável:

- `llama-factory`
- `dataset-preparation`
- `fine-tuning-strategy`

## Spec Kit

Quando existirem artefatos do Spec Kit, utilize-os como fonte de verdade para requisitos, planejamento e tarefas.

Consulte:

- `spec.md`
- `plan.md`
- `tasks.md`

antes de iniciar atividades relacionadas à implementação.

## Constitution

As regras definidas em `.specify/memory/constitution.md` devem ser respeitadas durante todo o fluxo.

## Delegação

- Tarefas relacionadas a datasets devem ser delegadas ao `dataset-specialist`.
- Tarefas relacionadas a estratégia e treinamento devem ser delegadas ao `training-engineer`.
- O `orchestrator` deve coordenar tarefas que envolvam múltiplas especialidades.

## Graphify

Utilize o knowledge graph disponibilizado pelo Graphify para compreender a estrutura e os relacionamentos do projeto antes de realizar buscas amplas no código.
