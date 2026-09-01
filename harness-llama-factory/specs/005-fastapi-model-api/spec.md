# Feature Specification: API local de inferência do EscutIA

**Feature Branch**: `feature/local-fastapi-model-api`
**Status**: Implementada em `EscutIA/platform/api-modelos`

## Objetivo

Disponibilizar uma API FastAPI pequena e independente para executar localmente
o modelo completo de sentimento `mdba/escutia-lora`, sem alterar o site Next.js.

## Requisitos

- A API MUST receber um JSON com o campo `text`.
- A API MUST retornar exatamente um dos rótulos `negativo`, `neutro` ou
  `positivo` quando a inferência for bem-sucedida.
- O modelo MUST ser baixado para `EscutIA/platform/api-modelos/modelo/` quando
  os pesos completos ainda não existirem localmente.
- O processo MUST reutilizar o modelo carregado em memória entre requisições.
- Um cache contendo somente `adapter_model.safetensors` MUST NOT ser tratado
  como modelo completo executável.
- A API MUST permanecer separada do código do site e não deve executar o
  harness nem `testar_modelo_lora.py`.
- Credenciais locais MUST permanecer em `.env.local`, ignorado pelo Git.

## Contrato

- `GET /health`: informa se o modelo está carregado e se os pesos existem no
  cache local.
- `POST /sentiment` e `POST /api/sentiment`: recebem
  `{"text":"..."}` e retornam `sentiment`, `model` e `elapsed_ms`.
