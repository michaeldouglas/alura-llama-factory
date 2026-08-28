# Como trabalhar na plataforma EscutIA

Este guia explica como trabalhar na aplicação localizada em:

```text
EscutIA/platform/
```

A plataforma é um contexto separado do harness de fine-tuning. O site e a API
ficarão no mesmo projeto Next.js full-stack.

## Estrutura

```text
EscutIA/platform/
├── site/       # projeto Next.js: frontend e API server-side
└── AGENTS.md   # regras locais da plataforma
```

Dentro de `site/`, use o frontend quando a tarefa mencionar interface, página,
componente, formulário, layout, navegação, CSS, responsividade ou experiência do
usuário.

Use as rotas server-side do Next.js, normalmente em `site/app/api/**/route.ts`,
quando a tarefa mencionar endpoint, backend, autenticação, regra de negócio,
banco de dados ou integração de serviço.

## Regras importantes

- O frontend deve conversar com as rotas da API por HTTP e por contratos bem
  definidos.
- A API deve usar runtime Node.js quando carregar o modelo ou acessar recursos
  server-side; não use Edge para a inferência sem uma decisão explícita.
- O modelo deve permanecer no servidor e não deve ser enviado ao navegador por
  padrão.
- A inferência será completamente em JavaScript/TypeScript. O arquivo
  `testar_modelo_lora.py` não faz parte da solução.
- O site não deve acessar diretamente datasets, checkpoints ou comandos do
  LLaMA-Factory.
- Código do site e da API não deve ser tratado como dataset ou configuração de
  treinamento.
- Alterações da plataforma devem permanecer em `EscutIA/platform/`, salvo se o
  pedido indicar explicitamente outro escopo.
- Não altere o harness quando a tarefa for exclusivamente da plataforma.
- Se uma tarefa envolver plataforma e fine-tuning, separe os dois escopos antes
  de começar e valide cada um de forma independente.

## Fluxo recomendado

1. Identifique se o pedido é de frontend, API ou dos dois dentro do mesmo projeto.
2. Consulte `EscutIA/platform/AGENTS.md` e a documentação existente.
3. Verifique a estrutura e os padrões já usados no módulo afetado.
4. Faça a menor alteração necessária dentro de `site/`, usando `site/app/api/`
   para rotas server-side.
5. Execute os testes, lint ou build correspondentes ao projeto Next.js.
6. Confirme que nenhum arquivo do harness ou dos artefatos de fine-tuning foi
   alterado por engano.

## Exemplos de prompts

### Trabalhar somente no site

```text
Trabalhe somente em EscutIA/platform/site.
Analise a página inicial e melhore a responsividade para telas pequenas.
Não altere o harness; mantenha a API dentro das rotas server-side do projeto
Next.js em `site/app/api/`.
Antes de editar, explique quais arquivos pretende modificar e depois valide o
build do site.
```

```text
No contexto do site em EscutIA/platform/site, adicione um estado de carregamento
ao componente ChatPreview. Preserve o design atual, não crie uma API nova e
execute os testes ou o lint disponíveis ao final.
```

### Trabalhar somente na API

```text
Trabalhe somente em EscutIA/platform/site.
Crie uma rota GET /api/health que retorne o status da API usando o padrão de
Route Handler do Next.js. Não altere o harness ou datasets. Primeiro verifique a
estrutura atual do projeto e valide a rota com um teste.
```

### Trabalhar nos dois módulos da plataforma

```text
Implemente a funcionalidade de status do treinamento dentro de
EscutIA/platform/site. Separe o trabalho em duas partes lógicas: Route Handler
da API e tela de consumo no frontend, mas mantenha ambos no mesmo projeto
Next.js. Defina primeiro o contrato HTTP, indique os arquivos de cada parte e
não altere o harness nesta tarefa.
```

### Pedido ambíguo

```text
Quero melhorar o chat da EscutIA.
Antes de alterar qualquer arquivo, determine se o pedido envolve a interface em
EscutIA/platform/site, as rotas API dentro do Next.js ou o fluxo de treinamento.
Se houver mais de um contexto, apresente a divisão do escopo.
```

## Frases que ajudam a preservar o contexto

Inclua no prompt expressões como:

- “trabalhe somente em `EscutIA/platform/site`”;
- “a API é o único backend desta tarefa”;
- “não altere o harness”;
- “não use datasets nem LLaMA-Factory”;
- “separe frontend e API e valide os dois módulos”.
