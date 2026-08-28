# Implementation Plan: Chat e validação de sentimento

## Escopo

Implementar a UI do chat e suas rotas protegidas dentro do Next.js existente em
`EscutIA/platform/site`, preservando a separação com o harness.

## Arquitetura

- `app/chat/page.tsx` autentica no servidor e carrega os resumos do histórico.
- `components/ChatWorkspace.tsx` compõe a interface client-side, busca local
  dos resumos carregados, envio e validação.
- `app/api/conversations/` protege a criação, leitura e persistência de mensagens.
- `app/api/sentiment/route.ts` autentica, chama o modelo por Hugging Face e
  persiste o turno classificado.
- `lib/sentiment.ts` mantém o prompt, parsing e chamada server-side.
- SQLite recebe `Conversation` e `Message` relacionados ao `User`.

## Runtime do modelo

O repositório publicado contém pesos do Transformers em `safetensors`, sem
artefatos ONNX para carregamento direto pelo Transformers.js. Nesta etapa, a
API usa o cliente HTTP do Hugging Face Inference Provider, com `HF_TOKEN` apenas
no servidor. A conversão para ONNX ou execução por Python está fora do escopo.
