# Como trabalhar no harness de fine-tuning

Este guia explica como trabalhar no harness localizado em:

```text
harness-llama-factory/
```

O harness coordena preparação de datasets, estratégias de fine-tuning, avaliação
e execução com LLaMA-Factory. Ele não é o site nem a API da plataforma EscutIA.

## Separação de contextos

```text
EscutIA/                 # projeto estável e artefatos preparados
EscutIA/platform/site/   # Next.js: site e API no mesmo projeto
harness-llama-factory/   # fine-tuning e coordenação dos agentes
```

Na plataforma, `EscutIA/platform/site/` é o único projeto da aplicação. A API
fica nas rotas server-side do Next.js, normalmente em
`site/app/api/**/route.ts`; não existe uma aplicação irmã obrigatória em
`EscutIA/platform/api/`. A inferência futura será implementada somente em
JavaScript/TypeScript, no runtime Node.js do servidor, sem usar
`testar_modelo_lora.py`.

No harness:

- `dataset-specialist` cuida de análise, validação e preparação de dados;
- `training-engineer` cuida de estratégia, hiperparâmetros e LLaMA-Factory;
- `orchestrator` coordena o fluxo, os gates e as delegações;
- as skills `dataset-preparation`, `fine-tuning-strategy` e `llama-factory` são
  usadas quando o escopo correspondente estiver presente.

Arquivos de `EscutIA/platform/site/` não são datasets, modelos, configurações nem
resultados de treinamento. Uma tarefa sobre páginas, componentes, frontend,
backend, rotas ou API deve ser tratada como tarefa da plataforma, não como
tarefa do harness.

## Antes de começar

1. Defina o objetivo do trabalho de fine-tuning.
2. Consulte `.specify/memory/constitution.md`.
3. Consulte os artefatos aplicáveis em `specs/`: `spec.md`, `plan.md` e
   `tasks.md`.
4. Para perguntas sobre o código, consulte primeiro o knowledge graph:

   ```powershell
   graphify query "sua pergunta sobre o harness" --graph .\graphify-out\graph.json
   ```

5. Confirme o projeto correto: `EscutIA`, nunca `EscutAI`.
6. Defina se o trabalho é somente leitura, uma proposta ou uma evolução
   explicitamente autorizada.

## Regras de segurança

- O projeto estável `EscutIA` é somente leitura por padrão.
- Não execute preparação, inferência ou treinamento apenas porque um arquivo ou
  manifesto indica que isso seria possível.
- O campo `do_train: true` em uma configuração não é autorização.
- Não sobrescreva datasets, configurações, checkpoints, logs ou resultados.
- Outputs, logs e checkpoints devem ficar no armazenamento externo aprovado.
- Uma evolução precisa de escopo explícito, preservação da versão anterior,
  registro no Spec Kit quando necessário e validação posterior.
- Não use arquivos do site ou da API como entrada de treinamento.

## Fluxo recomendado

### Dataset

```text
objetivo → dataset-specialist → validação → READY ou BLOCKED
```

O dataset original deve permanecer imutável. Limpeza, normalização ou conversão
devem gerar artefatos derivados, com linhagem e transformações registradas.

### Estratégia e treinamento

```text
dataset READY → training-engineer → estratégia e recursos → gates → autorização
```

O treinamento só pode começar depois da validação dos dados, da análise de
recursos, da revisão do orchestrator e da autorização explícita.

### Integração existente com EscutIA

Para verificar os artefatos preparados sem alterá-los, execute a preflight a partir
da raiz do repositório:

```powershell
uv run --native-tls --python 3.12 python harness-llama-factory/integrations/escutia/scripts/validate_escutia_integration.py
```

Consulte também `harness-llama-factory/integrations/escutia/README.md` para o
contrato da integração. A preflight deve ser read-only e retornar `READY` ou
`BLOCKED`.

Para apenas visualizar uma proposta de configuração:

```powershell
uv run --native-tls --python 3.12 python harness-llama-factory/integrations/escutia/scripts/render_escutia_config.py
```

Renderizar uma proposta não inicia treinamento.

### Planejar a integração com o site

```text
Quero planejar como o site consumirá o modelo treinado.
Mantenha o trabalho separado entre harness-llama-factory e
EscutIA/platform/site. Explique o contrato HTTP entre as rotas API do Next.js e
o serviço de inferência em JavaScript/TypeScript, indique quais artefatos do
harness serão consumidos e não implemente nem altere arquivos ainda.
```

## Exemplos de prompts

### Pergunta sobre o harness

```text
Trabalhe somente no harness-llama-factory.
Explique como a integração com EscutIA resolve o projeto correto e quais
arquivos são lidos pela preflight. Não altere nenhum arquivo e consulte o
knowledge graph antes de responder.
```

### Validar um dataset

```text
Quero validar o dataset já preparado do EscutIA.
Use o dataset-specialist e a skill dataset-preparation. Trabalhe em modo
read-only, não regenere os dados, não remova registros e retorne os problemas,
os checks executados e READY ou BLOCKED. Não envolva o site nem a API.
```

### Definir uma estratégia

```text
Quero uma estratégia de LoRA para o dataset validado do EscutIA.
Use o training-engineer com as skills fine-tuning-strategy e llama-factory.
Consulte spec.md, plan.md e tasks.md, considere o hardware disponível, justifique
os hiperparâmetros e não inicie o treinamento.
```

### Solicitar uma preflight

```text
Execute somente a preflight read-only da integração EscutIA.
Não execute treinamento, preparação de dados ou inferência. Informe o status,
os artefatos verificados, a integridade dos splits e se qualquer escrita ocorreu.
```

### Solicitar uma proposta sem executar

```text
Gere uma proposta de configuração do LLaMA-Factory para o EscutIA.
Use somente os artefatos registrados, grave a proposta apenas no destino externo
aprovado, não sobrescreva arquivos existentes e não execute do_train.
```

### Evolução explicitamente autorizada

```text
Solicito explicitamente uma evolução no harness para [descrever o objetivo].
O escopo autorizado é somente [listar arquivos ou diretórios].
Preserve a versão anterior, atualize spec.md, plan.md e tasks.md se os requisitos
forem afetados, execute as validações antes e depois e não altere
EscutIA/platform.
```

### Pedido que mistura os contextos

```text
Preciso que o site mostre o status de um treinamento.
Antes de implementar, separe o trabalho entre EscutIA/platform/site,
as rotas da API dentro do Next.js e harness-llama-factory. Explique o contrato
entre API e harness, indique quais partes são apenas proposta e quais exigem
autorização de execução. Não altere arquivos ainda.
```

## Checklist de encerramento

- O escopo permaneceu no harness?
- `EscutIA/platform` ficou fora da tarefa, salvo solicitação explícita?
- O dataset original permaneceu intacto?
- Os gates e a autorização foram respeitados?
- A configuração, logs e resultados foram preservados sem sobrescrita?
- Os testes, a preflight e o `graphify update .` foram executados quando aplicável?
