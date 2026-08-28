# Plataforma EscutIA

Esta pasta é um contexto de aplicação separado do projeto estável de fine-tuning
e do harness localizado em `../../harness-llama-factory/`.

## Escopo

- `site/` é uma aplicação Next.js full-stack. Ela contém a interface, páginas,
  componentes, estilos e experiência do usuário.
- As rotas da API ficam dentro do mesmo projeto, principalmente em
  `site/app/api/**/route.ts`, junto das regras de negócio e integrações do
  backend.
- **Exceção atual:** `api-modelos/` é um serviço FastAPI separado, criado
  exclusivamente para executar localmente o modelo de sentimento em Python.
  Ele não substitui as rotas do site, não contém regras de negócio do produto
  e não deve ser misturado ao código React/Next.js.
- Alterações de site ou API devem permanecer dentro de `EscutIA/platform/`,
  salvo quando o responsável solicitar explicitamente outro escopo.

## Limites com o harness

- Não trate código, dependências ou artefatos desta pasta como dataset, modelo,
  configuração de treinamento ou resultado de experimento.
- Não execute nem altere o harness durante uma tarefa exclusiva da plataforma.
- Tarefas de fine-tuning devem ser direcionadas ao `harness-llama-factory/` e
  seguir as instruções e gates próprios de lá.
- Se uma mudança precisar envolver a plataforma e o fine-tuning, registre os dois
  escopos separadamente e preserve as validações de cada contexto.

## Execução do modelo

- O serviço excepcional em `api-modelos/` usa Python, FastAPI e Transformers
  para carregar o modelo LoRA completo localmente.
- O modelo fica em `api-modelos/modelo/`, é baixado apenas quando os pesos
  completos não estão no cache e permanece carregado em memória enquanto a API
  estiver em execução.
- `testar_modelo_lora.py` continua sendo referência do comportamento e não é
  executado pela API.
- O site continuará consumindo um contrato HTTP; sua integração com este
  serviço será feita em uma etapa separada.

## Comunicação

O frontend deve consumir as rotas da API por contrato HTTP. Ele não deve acessar
diretamente datasets, checkpoints, scripts ou comandos do LLaMA-Factory.

## Skills obrigatórias do site

As skills abaixo pertencem exclusivamente ao site e devem ser usadas nas
solicitações de UI e código React/Next.js dentro de `site/`:

- `frontend-design`: usar antes de criar ou alterar páginas, componentes,
  layouts, estilos e demais elementos visuais. A direção visual existente deve
  ser preservada ou evoluída conscientemente.
- `vercel-react-best-practices`: usar ao implementar, revisar ou refatorar
  componentes, páginas, rotas e carregamento de dados React/Next.js, verificando
  performance, waterfalls, bundle, renderização e limites server/client.
- `vercel-composition-patterns`: usar ao revisar a arquitetura dos componentes,
  APIs reutilizáveis, composição, estado compartilhado e evitar proliferação de
  props booleanas.
- `web-design-guidelines`: usar ao revisar UX, acessibilidade e conformidade da
  interface com as diretrizes atuais de componentes web.

Para mudanças de interface, a ordem recomendada é usar primeiro
`frontend-design`, depois `vercel-composition-patterns`,
`vercel-react-best-practices` e, por fim, `web-design-guidelines`. A última deve
consultar as diretrizes atuais antes da revisão. Essas skills não se aplicam ao
harness de fine-tuning nem aos artefatos de treinamento.
