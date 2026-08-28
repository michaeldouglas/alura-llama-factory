# Plataforma EscutIA

Esta pasta é um contexto de aplicação separado do projeto estável de fine-tuning
e do harness localizado em `../../harness-llama-factory/`.

## Escopo

- `site/` é uma aplicação Next.js full-stack. Ela contém a interface, páginas,
  componentes, estilos e experiência do usuário.
- As rotas da API ficam dentro do mesmo projeto, principalmente em
  `site/app/api/**/route.ts`, junto das regras de negócio e integrações do
  backend. Não há uma pasta `platform/api` separada como requisito desta
  arquitetura.
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

- A implementação futura será completamente em JavaScript/TypeScript.
- O modelo será carregado no servidor pela API do Next.js, usando runtime
  Node.js; não deve ser executado no navegador por padrão.
- `testar_modelo_lora.py` não faz parte da arquitetura planejada.
- O modelo deverá estar em formato compatível com o runtime JavaScript escolhido
  quando a implementação for solicitada. Essa escolha ainda não foi feita.

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

Para mudanças de interface, a ordem recomendada é usar primeiro
`frontend-design` e depois `vercel-react-best-practices`. Essas skills não se
aplicam ao harness de fine-tuning nem aos artefatos de treinamento.
