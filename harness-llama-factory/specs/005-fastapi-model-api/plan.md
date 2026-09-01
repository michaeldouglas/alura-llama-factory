# Implementation Plan: API local de inferência do EscutIA

## Arquitetura

- `EscutIA/platform/api-modelos/main.py` contém o aplicativo FastAPI, o ciclo
  de vida do modelo, o cache local, o prompt e o parsing da resposta.
- `api-modelos/modelo/` é o diretório de pesos baixados e fica fora do Git.
- `api-modelos/.env.local` contém configurações locais opcionais, como o token
  do Hugging Face para um repositório privado.
- O modelo é carregado no startup pelo lifespan da aplicação e protegido por
  um lock durante a inferência para evitar execuções concorrentes sobre o
  pipeline compartilhado.

## Fora do escopo

- Alterar o site Next.js.
- Integrar o site à API.
- Alterar o harness de fine-tuning.
- Converter o modelo para ONNX.
