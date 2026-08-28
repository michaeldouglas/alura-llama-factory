# Feature Specification: Chat e validação de sentimento EscutIA

**Feature Branch**: `feature/chat-sentiment`
**Status**: Implementada em `EscutIA/platform/site` somente

## Objetivo

Entregar um espaço protegido de conversa textual, com histórico pesquisável e
validação opcional do sentimento da mensagem pelo modelo `mdba/escutia-lora`.

## Requisitos

- O chat MUST exigir uma sessão Google válida.
- A interface MUST apresentar logo, perfil do usuário, busca de conversas,
  histórico e composição de mensagens de texto.
- O sistema MUST persistir conversas e mensagens no SQLite pertencente ao site.
- A validação MUST executar pela API server-side em JavaScript/TypeScript e
  retornar exatamente um dos rótulos `negativo`, `neutro` ou `positivo`.
- O token Hugging Face MUST permanecer em variável de ambiente server-side.
- A primeira análise MAY demorar mais por aquecimento do provedor; o cliente
  não deve baixar pesos a cada mensagem.
- Esta feature MUST NOT usar `testar_modelo_lora.py`, alterar o harness de
  fine-tuning ou implementar Stripe.

## Prompt de classificação

O modelo recebe a instrução para classificar o sentimento predominante como
negativo, neutro ou positivo e responder somente em JSON no formato
`{"sentimento":"<rotulo>"}`, usando como contexto de entrada o texto escrito
pela pessoa após a pergunta “Como você está se sentindo hoje?”.
