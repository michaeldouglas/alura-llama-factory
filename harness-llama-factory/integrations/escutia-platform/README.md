# Contexto da plataforma EscutIA

Este documento registra a fronteira entre o harness de fine-tuning e a aplicação
EscutIA. Ele não transforma a plataforma em uma entrada de treinamento e não
autoriza alterações no projeto externo.

## Localização

- Raiz da plataforma: `../EscutIA/platform/`
- Aplicação Next.js full-stack: `../EscutIA/platform/site/`
- Rotas da API: `../EscutIA/platform/site/app/api/`
- Harness: `../../harness-llama-factory/`

## Regras de contexto

- Site, páginas, componentes, CSS, layout, frontend, rotas, chamadas HTTP,
  backend, endpoints e API pertencem ao contexto da plataforma.
- Site e API fazem parte do mesmo projeto Next.js em `platform/site`; a API não
  deve ser tratada como uma aplicação irmã em `platform/api`.
- A API deve ser implementada com Route Handlers ou outro mecanismo server-side
  do Next.js, mantendo o frontend e o backend no mesmo projeto.
- A inferência deve ser completamente JavaScript/TypeScript, executada no
  runtime Node.js do servidor. O arquivo `testar_modelo_lora.py` não será usado.
- O modelo deve permanecer no servidor e ser acessado pelo site através das
  rotas da API. A escolha do runtime e do formato compatível do modelo fica para
  a etapa de implementação.
- Dataset, modelo, LoRA, QLoRA, hiperparâmetros, avaliação, jobs de treinamento
  e LLaMA-Factory pertencem ao contexto do harness.
- A integração `integrations/escutia/` continua limitada aos artefatos estáveis
  de dados e treinamento localizados no restante de `EscutIA/`.
- O harness não deve inferir uma tarefa de fine-tuning a partir de arquivos do
  site ou da API, nem inferir uma tarefa de alteração da plataforma a partir de
  artefatos de treinamento.
- O acesso à plataforma deve ocorrer somente quando a solicitação mencionar
  explicitamente o site, a API ou o contexto da plataforma. Por padrão, a
  plataforma permanece sem escrita e sem execução automática pelo harness.
- Se uma tarefa envolver plataforma e fine-tuning, o escopo deve ser dividido
  em partes independentes, com caminhos, responsáveis e validações distintos.

## Skills do site

Para tarefas de UI ou código React/Next.js em `platform/site`, use as skills
exclusivas da plataforma nesta ordem:

1. `frontend-design` para direção visual e implementação de interface.
2. `vercel-composition-patterns` para arquitetura e composição reutilizável de
   componentes.
3. `vercel-react-best-practices` para performance e padrões React/Next.js.
4. `web-design-guidelines` para revisão de UX e acessibilidade; consulte a fonte
   atual das diretrizes antes de cada revisão.
5. `copywriting` para textos de páginas, títulos, benefícios, CTAs, propostas de
   valor e metadados editoriais.
6. `seo-audit` para títulos, descrições, headings, conteúdo, palavras-chave,
   indexação, links, imagens e demais pontos técnicos de SEO.
7. `interaction-design` para animações, transições, hover/clique, skeletons,
   estados de carregamento, microinterações e `prefers-reduced-motion`.

Em páginas de marketing, `copywriting` deve orientar a revisão do texto antes
de `seo-audit`, que valida o resultado editorial e técnico. As duas skills são
exclusivas da plataforma e não devem ser aplicadas a datasets, modelos,
treinamento ou LLaMA-Factory.
Quando houver movimento ou feedback de interação, `interaction-design` deve
orientar a implementação, com animações performáticas baseadas em `transform` e
`opacity`.

Nenhuma dessas skills deve ser aplicada ao harness de modelos, datasets,
treinamento ou LLaMA-Factory.

## Stripe no site

As skills Stripe instaladas no harness e o servidor MCP Stripe configurado em
`.codex/config.toml` são capacidades exclusivas de `EscutIA/platform/site/`.
Elas não devem ser usadas em tarefas do harness de LLaMA-Factory.

A ativação é sob demanda e exige as duas condições abaixo:

1. o alvo da tarefa é o site ou suas rotas server-side em
   `EscutIA/platform/site/`; e
2. o pedido é explicitamente sobre Stripe, pagamentos, billing, Connect,
   marketplace, onboarding/KYC, Stripe Apps ou o planejamento de uma
   funcionalidade Stripe.

Alterações comuns de páginas, componentes, estilos, rotas ou API não ativam as
skills Stripe apenas por ocorrerem no site. Para cada tarefa, carregue somente
a skill Stripe correspondente ao problema, conforme os gatilhos descritos em
`AGENTS.md`.

O MCP pode permanecer registrado no projeto para estar disponível quando
solicitado, mas sua disponibilidade não autoriza chamadas automáticas nem
ações de escrita. Qualquer operação externa ou mutação deve continuar sujeita
à autorização e às confirmações normais da tarefa.

## Contrato entre site e API

Quando o frontend precisar de funcionalidades do produto, ele deve consumi-las
pelas rotas da API dentro do mesmo projeto Next.js. A API é a fronteira entre a
interface e os serviços de backend; o site não deve acessar diretamente scripts,
datasets, checkpoints ou comandos do LLaMA-Factory.
