# Feature Specification: Provedor local de sentimento no site

**Feature Branch**: `feature/site-local-model-provider`
**Status**: Implementada em `EscutIA/platform/site`

## Objetivo

Permitir que o site escolha entre a API FastAPI local e o Hugging Face para
validar sentimentos, usando a API local como padrão.

## Requisitos

- `USE_LOCAL_MODEL_API` MUST usar a API local quando ausente ou diferente de
  `false`.
- Quando `USE_LOCAL_MODEL_API="true"`, o site MUST chamar
  `LOCAL_MODEL_API_URL/sentiment`, cujo padrão é `http://localhost:8000/sentiment`.
- Quando `USE_LOCAL_MODEL_API="false"`, o site MUST manter a chamada atual ao
  Hugging Face e exigir `HF_TOKEN`.
- A troca de provedor MUST ocorrer somente no backend do site; tokens e URLs não
  devem ser expostos ao navegador.
- O site MUST NOT fazer fallback automático entre os provedores.

## Fora do escopo

- Alterar a interface do chat.
- Alterar o serviço FastAPI.
- Converter o modelo para ONNX.
