# Integração do harness com o EscutIA

Esta integração faz o harness consumir os artefatos já preparados no projeto
`EscutIA/`. O projeto EscutIA é somente leitura nesta integração: o harness não
executa seus scripts de preparação, não edita seus arquivos e não grava saídas
em `EscutIA/`.

O perfil versionado em `escutia-integration.json` fixa o dataset JSON de
sentimento, o modelo Qwen2.5-0.5B-Instruct, a revisão do modelo e a estratégia
LoRA SFT. A validação também confere o relatório `DATA_READY_FOR_SFT`, o
isolamento entre splits, o hash da avaliação congelada, os hashes das fontes e
a coerência da configuração LoRA existente.

## Verificar a integração

Na raiz de `harness-llama-factory/`:

```powershell
uv run --python 3.12 python integrations/escutia/scripts/validate_escutia_integration.py
```

O comando é read-only. Ele retorna `READY` quando os artefatos externos estão
presentes e coerentes; qualquer divergência retorna `BLOCKED` e código de saída
2. `EscutAI` é rejeitado explicitamente para evitar erro de nomenclatura.

## Renderizar a proposta do LLaMA-Factory

O comando abaixo imprime uma configuração resolvida sem criar arquivo:

```powershell
uv run --python 3.12 python integrations/escutia/scripts/render_escutia_config.py
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
