## graphify

The repository root is the parent directory `C:\Users\mdbaa\development\alura\alura-llama-factory`; the harness lives in `harness-llama-factory/`, the stable fine-tuning project lives in `EscutIA/`, and the separate application context lives in `EscutIA/platform/`.

The active knowledge graph for this harness is at `.\graphify-out/`. Keep exactly one active `graphify-out/` in this harness; the parent repository graph is not used by this project.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>" --graph .\graphify-out\graph.json`. Use the same `--graph .\graphify-out\graph.json` option with `graphify path` and `graphify explain` for relationships and focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty `.\graphify-out/` files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code in the repository, run `graphify update .` from this harness directory to keep the local graph current (AST-only, no API cost).

# Harness de Fine-Tuning

Este projeto utiliza um harness especializado em fine-tuning de modelos com LLaMA-Factory.

O ambiente Python é único e pertence à raiz do repositório:
`C:\Users\mdbaa\development\alura\alura-llama-factory\pyproject.toml` e
`uv.lock`. O harness não possui `pyproject.toml` nem `uv.lock` próprios; os
comandos `uv` executados a partir desta pasta devem descobrir a configuração da
raiz.

O `EscutIA` representa a versão estável atual. O modo padrão do harness é
somente leitura, mas isso não congela o projeto: quando o responsável solicitar
explicitamente uma evolução, o orchestrator pode coordenar alterações no escopo
pedido, preservando a versão anterior, registrando a mudança no Spec Kit quando
necessário e executando as validações antes e depois da alteração.

## Separação de contextos

- `EscutIA/` é o projeto estável usado pela integração de fine-tuning: datasets,
  relatórios, manifestos e configurações relacionadas ao treinamento.
- `EscutIA/platform/` é um contexto de aplicação separado. O projeto Next.js
  full-stack fica em `EscutIA/platform/site/` e contém tanto a interface quanto
  a API por meio das rotas do próprio Next.js.
- Solicitações sobre páginas, componentes, estilos, rotas, frontend, backend,
  endpoints ou API devem ser tratadas como trabalho da plataforma; não são
  tarefas de dataset ou treinamento por inferência.
- Solicitações sobre datasets, modelos, LoRA, QLoRA, hiperparâmetros, avaliação
  ou LLaMA-Factory devem permanecer no contexto do harness e da integração
  `integrations/escutia/`.
- Arquivos de `EscutIA/platform/` não devem ser considerados artefatos de
  treinamento, nem ser lidos, executados ou alterados durante uma tarefa de
  fine-tuning sem que a solicitação inclua explicitamente a plataforma.
- A API da plataforma não deve ser modelada como uma pasta irmã obrigatória:
  para este projeto, ela pertence ao mesmo projeto Next.js do site, com rotas
  server-side como `EscutIA/platform/site/app/api/**/route.ts`.
- A inferência do modelo da plataforma será feita em JavaScript/TypeScript no
  runtime Node.js do servidor. `testar_modelo_lora.py` não faz parte desse
  fluxo; nenhuma implementação do modelo deve ser criada nesta etapa.
- Quando uma solicitação envolver os dois contextos, o orchestrator deve separar
  o escopo, indicar os caminhos afetados e manter as validações de cada parte
  independentes.
- As instruções locais de `EscutIA/platform/AGENTS.md` complementam estas regras
  quando o trabalho estiver dentro da plataforma.

## Skills exclusivas da plataforma

- `frontend-design` e `vercel-react-best-practices` são skills exclusivas de
  `EscutIA/platform/` e não devem ser aplicadas a tarefas de fine-tuning,
  datasets, modelos ou LLaMA-Factory.
- Quando uma solicitação envolver o site, páginas, componentes, estilos ou
  experiência de usuário React/Next.js, o orchestrator deve usar as duas
  skills. A ordem é `frontend-design` para definir e preservar a direção visual
  e `vercel-react-best-practices` para revisar a implementação React/Next.js,
  performance, carregamento e divisão entre servidor e cliente.
- Alterações exclusivamente documentais ou de configuração da plataforma podem
  usar apenas a orientação necessária; qualquer criação, revisão ou refatoração
  de UI deve passar pelas duas skills.

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
