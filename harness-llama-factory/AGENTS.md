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

- `frontend-design`, `vercel-react-best-practices`,
  `vercel-composition-patterns`, `web-design-guidelines`, `copywriting`,
  `seo-audit` e `interaction-design` são skills exclusivas de
  `EscutIA/platform/` e não devem ser aplicadas a tarefas de fine-tuning,
  datasets, modelos ou LLaMA-Factory.
- Quando uma solicitação envolver o site, páginas, componentes, estilos ou
  experiência de usuário React/Next.js, o orchestrator deve usar as quatro
  skills aplicáveis. A ordem é `frontend-design` para definir e preservar a
  direção visual, `vercel-composition-patterns` para avaliar a arquitetura e a
  composição dos componentes, `vercel-react-best-practices` para revisar a
  implementação React/Next.js, performance, carregamento e divisão entre
  servidor e cliente, e `web-design-guidelines` para revisar UX e acessibilidade.
- Use `copywriting` em páginas de marketing, títulos, benefícios, CTAs,
  propostas de valor e metadados editoriais; use `seo-audit` para revisar
  títulos, descrições, headings, conteúdo, palavras-chave, indexação e demais
  pontos de SEO do site. Essas skills complementam as quatro skills de UI e
  nunca devem ser chamadas para o harness de LLaMA-Factory.
- Use `interaction-design` para animações de entrada, transições, hover/clique,
  skeletons, estados de carregamento, microinterações e suporte a
  `prefers-reduced-motion`, sempre priorizando `transform` e `opacity`.
- Ao usar `web-design-guidelines`, consulte a fonte atual das diretrizes antes
  de cada revisão, conforme a própria skill orienta.
- Alterações exclusivamente documentais ou de configuração da plataforma podem
  usar apenas a orientação necessária; qualquer criação, revisão ou refatoração
  de UI deve passar pelas duas skills.

## Skills e MCP do Stripe na plataforma

- As skills `connect-recommend`,
  `connect-required-verification-information`, `stripe-apps`,
  `stripe-best-practices`, `stripe-directory`, `stripe-docs`,
  `stripe-projects` e `upgrade-stripe`, assim como o MCP configurado em
  `.codex/config.toml`, pertencem exclusivamente ao contexto da plataforma em
  `EscutIA/platform/site/`. Elas não fazem parte do harness de datasets,
  modelos, treinamento ou LLaMA-Factory.
- Só ative uma skill Stripe ou chame uma ferramenta do MCP Stripe quando o
  pedido mencionar explicitamente Stripe, pagamentos, billing, Connect,
  marketplace, onboarding/KYC, Stripe Apps ou o planejamento de uma
  funcionalidade Stripe para o site. Um pedido genérico de planejamento e uma
  alteração comum do site não ativam essas capacidades.
- Para tarefas do site sem Stripe, use somente as skills de UI, React/Next.js,
  conteúdo, SEO ou interação que forem pertinentes ao pedido.
- Use apenas a skill Stripe específica ao problema: `stripe-docs` para
  documentação, `stripe-best-practices` para decisões de integração,
  `connect-recommend` para Connect e distribuição de pagamentos,
  `connect-required-verification-information` para verificação/KYC,
  `stripe-apps` para Stripe Apps, `stripe-projects` para provisionamento,
  `stripe-directory` para selecionar ou engajar um provedor, e
  `upgrade-stripe` para upgrades de API/SDK. Não aplique o conjunto inteiro por
  padrão.
- Mesmo em uma tarefa Stripe, mantenha o código e as alterações dentro de
  `EscutIA/platform/site/`, salvo autorização explícita para outro escopo. Não
  leia, execute ou altere artefatos de fine-tuning para implementar Stripe.

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
