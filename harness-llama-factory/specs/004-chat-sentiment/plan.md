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
- `agent/graph/nodes/analisar-sentimento.ts` ignora mensagens fáticas sem sinal
  emocional e centraliza a decisão de quando o classificador deve ser chamado.
- `app/api/agent/route.ts` devolve no evento final o vínculo entre a mensagem do
  usuário e o sentimento persistido para a UI reconciliar seu estado otimista.
- `components/ChatWorkspace.tsx` apresenta o sentimento no balão da resposta e
  mantém os controles de ação em uma linha externa ao balão.
- `lib/sentiment.ts` mantém o prompt, parsing e chamada server-side.
- SQLite recebe `Conversation` e `Message` relacionados ao `User`.

## Runtime do modelo

O repositório publicado contém pesos do Transformers em `safetensors`, sem
artefatos ONNX para carregamento direto pelo Transformers.js. Por padrão, a
rota server-side do site chama a API FastAPI local em
`EscutIA/platform/api-modelos`, que carrega o modelo completo e o mantém em
cache. A configuração `USE_LOCAL_MODEL_API="false"` preserva o caminho HTTP do
Hugging Face usando `HF_TOKEN` somente no servidor.
