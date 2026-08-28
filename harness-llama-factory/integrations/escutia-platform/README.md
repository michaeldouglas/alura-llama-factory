# Contexto da plataforma EscutIA

Este documento registra a fronteira entre o harness de fine-tuning e a aplicação
EscutIA. Ele não transforma a plataforma em uma entrada de treinamento e não
autoriza alterações no projeto externo.

## Localização

- Raiz da plataforma: `../EscutIA/platform/`
- Site: `../EscutIA/platform/site/`
- API: `../EscutIA/platform/api/` quando criada
- Harness: `../../harness-llama-factory/`

## Regras de contexto

- Site, páginas, componentes, CSS, layout, frontend, rotas, chamadas HTTP,
  backend, endpoints e API pertencem ao contexto da plataforma.
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

## Contrato entre site e API

Quando o site precisar de funcionalidades do produto, ele deve consumi-las pela
API. A API é a fronteira entre a interface e serviços de backend; o site não deve
acessar diretamente scripts, datasets, checkpoints ou comandos do LLaMA-Factory.
