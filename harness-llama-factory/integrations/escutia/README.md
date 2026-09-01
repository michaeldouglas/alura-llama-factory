# Integração do harness com o EscutIA

Esta integração faz o harness consumir os artefatos já preparados no projeto
`EscutIA/`. O modo padrão protege a versão estável atual: o harness não executa
scripts de preparação, não edita arquivos e não grava saídas em `EscutIA/` sem
uma solicitação explícita de evolução do responsável.

## Fronteira com a plataforma

`EscutIA/platform/` é uma aplicação separada dentro do repositório. O projeto
Next.js full-stack fica em `EscutIA/platform/site/` e contém o frontend e a API
por meio das rotas server-side do próprio Next.js. Ela não faz parte desta
integração de dataset e fine-tuning. Os arquivos da plataforma não são artefatos
de treinamento, não são incluídos na preflight e não devem ser executados ou
alterados por esta integração.

Para o mapa de contexto do harness e as regras específicas da aplicação, consulte
`integrations/escutia-platform/README.md` e `EscutIA/platform/AGENTS.md`.

Uma evolução futura é permitida quando o responsável pedir explicitamente a
alteração e o escopo estiver claro. Nesse caso, o orchestrator deve consultar o
Spec Kit, preservar a versão anterior, registrar a mudança e executar validações
antes e depois. Datasets devem ser derivados e revisados antes de qualquer
promoção autorizada para `EscutIA/`; a fonte não deve ser sobrescrita em silêncio.

O perfil versionado em `escutia-integration.json` fixa o dataset JSON de
sentimento, o modelo Qwen2.5-0.5B-Instruct, a revisão do modelo e a estratégia
LoRA SFT. A validação também confere o relatório `DATA_READY_FOR_SFT`, o
isolamento entre splits, o hash da avaliação congelada, os hashes das fontes e
a coerência da configuração LoRA existente.

## Verificar a integração

Na raiz do repositório (`alura-llama-factory/`):

```powershell
uv run --native-tls --python 3.12 python harness-llama-factory/integrations/escutia/scripts/validate_escutia_integration.py
```

O `pyproject.toml` e o `uv.lock` da raiz são a única configuração do ambiente
Python. Por isso, os comandos devem ser executados a partir da raiz do
repositório, que também é onde fica o `.venv` compartilhado.

O comando é read-only. Ele retorna `READY` quando os artefatos externos estão
presentes e coerentes; qualquer divergência retorna `BLOCKED` e código de saída
2. `EscutAI` é rejeitado explicitamente para evitar erro de nomenclatura.

## Renderizar a proposta do LLaMA-Factory

O comando abaixo imprime uma configuração resolvida sem criar arquivo:

```powershell
uv run --native-tls --python 3.12 python harness-llama-factory/integrations/escutia/scripts/render_escutia_config.py
```

Para persistir uma cópia, informe explicitamente um caminho abaixo de
`%LOCALAPPDATA%/alura-llama-factory/escutia-integration/`. O arquivo não pode
ser sobrescrito. O `do_train: true` representa a proposta do treinamento; ele
não concede autorização para executar. O fluxo de gates do Spec Kit continua
obrigatório.

As saídas pesadas, logs e checkpoints propostos ficam fora do repositório em
`%LOCALAPPDATA%/alura-llama-factory/escutia-integration/`. O modelo e os dados
existentes continuam sendo lidos de seus locais atuais, sem cópia ou alteração.

## Responsabilidades

- `orchestrator`: executa a preflight, controla gates, autorizações e a política
  de não escrita.
- `dataset-specialist`: é responsável por qualquer futura validação ou derivação
  de dados; esta integração apenas verifica a validação já registrada.
- `training-engineer`: usa a proposta renderizada para revisar recursos e
  executar somente após autorização explícita.

Nenhum comando desta pasta inicia treinamento automaticamente.
