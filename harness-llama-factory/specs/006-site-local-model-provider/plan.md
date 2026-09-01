# Implementation Plan: Provedor local de sentimento no site

## Arquitetura

- `site/lib/sentiment.ts` seleciona o provedor no servidor com
  `USE_LOCAL_MODEL_API`.
- O caminho local envia `{ "text": "..." }` para a API FastAPI e valida o
  rótulo retornado antes de repassá-lo à rota do chat.
- O caminho Hugging Face permanece isolado na mesma biblioteca e é ativado
  somente quando a flag for explicitamente `false`.
- `.env.example`, README e tutorial documentam a execução dos dois serviços.

## Fora do escopo

- Mudanças visuais ou de componentes React.
- Fallback automático quando a API local estiver indisponível.
