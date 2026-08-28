# Plataforma EscutIA

Esta pasta é um contexto de aplicação separado do projeto estável de fine-tuning
e do harness localizado em `../../harness-llama-factory/`.

## Escopo

- `site/` contém a interface, páginas, componentes, estilos e experiência do
  usuário.
- `api/` contém a API, endpoints, regras de negócio e integrações do backend,
  quando criada.
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

## Comunicação

O site deve consumir a API por contrato HTTP. Ele não deve acessar diretamente
datasets, checkpoints, scripts ou comandos do LLaMA-Factory.
