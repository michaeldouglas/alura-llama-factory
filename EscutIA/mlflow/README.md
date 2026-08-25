# MLflow — EscutIA

O MLflow acompanha cada treinamento LoRA como uma execução comparável. Ele mostra loss, learning rate, parâmetros, épocas, passos e duração enquanto o treinamento acontece.

## 1. Preparar o ambiente

Na raiz do repositório:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory
uv sync --native-tls
```

O ambiente `.venv` contém o MLflow e as dependências usadas pelo notebook de fine-tuning.

## 2. Iniciar o MLflow

Ainda na raiz do repositório, execute:

```powershell
.venv\Scripts\mlflow.exe ui `
  --backend-store-uri "sqlite:///./EscutIA/mlflow.db" `
  --default-artifact-root ".\EscutIA\mlflow-artifacts" `
  --host 127.0.0.1 `
  --port 5000
```

Abra no navegador:

```text
http://127.0.0.1:5000
```

Mantenha esse terminal aberto durante o treinamento. Não é necessário executar o notebook antes de iniciar o MLflow.

O banco SQLite fica em `EscutIA/mlflow.db` e os artefatos ficam em `EscutIA/mlflow-artifacts`. O dataset continua em `EscutIA/dataset` e não deve ser colocado dentro do banco ou da pasta de artefatos.

## 3. Executar o treinamento

Em outro terminal, na raiz do repositório:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory
.venv\Scripts\jupyter.exe lab
```

Abra `EscutIA/fine_tuning_lora/Fine_Tuning_LoRA_EscutIA.ipynb` e execute as células em ordem.

O notebook configura automaticamente `MLFLOW_TRACKING_URI` para o mesmo banco SQLite e usa o experimento `escutia-lora`. Não é necessário definir essa variável manualmente quando o treinamento é iniciado pelo notebook.

## 4. Acompanhar uma execução

1. Acesse `http://127.0.0.1:5000`.
2. Abra o experimento `escutia-lora`.
3. Selecione a execução `lora_escutia`.
4. Atualize a página para acompanhar as métricas.

As métricas são enviadas a cada 10 passos, conforme `logging_steps: 10`. Durante o treinamento, acompanhe `loss`, `eval_loss`, `learning_rate`, `epoch` e `step`.

Depois que a célula de treinamento terminar, execute a célula `Registrar contexto e progresso no MLflow` do notebook. Ela adiciona `training_percentage`, hash do dataset, decisão do gate e registra como artefatos a configuração YAML, o relatório de validação e `trainer_log.jsonl`.

O adapter e os checkpoints continuam sendo salvos em:

```text
EscutIA/fine_tuning_lora/outputs/resultados/lora_escutia/
```

Para o fluxo completo do treinamento, dataset, validações e inferência, consulte [`fine_tuning_lora/README.md`](../fine_tuning_lora/README.md).

## Problemas comuns

### Erro sobre filesystem tracking backend

Não use o diretório `EscutIA/mlflow` como valor de `--backend-store-uri`. Esse formato é o filesystem backend legado e pode ser bloqueado pelas versões atuais do MLflow. Use:

```text
sqlite:///./EscutIA/mlflow.db
```

### Nenhuma execução aparece

Confirme que:

- o notebook de treinamento foi executado até a célula que inicia o `llamafactory-cli`;
- o experimento selecionado é `escutia-lora`;
- a execução alcançou os primeiros passos de logging;
- o MLflow UI está usando o mesmo arquivo `EscutIA/mlflow.db`.

Treinamentos interrompidos antes da configuração SQLite não aparecem automaticamente no novo banco. Os outputs produzidos continuam em `EscutIA/fine_tuning_lora/outputs/`.

Accuracy, precision, recall e F1 não são métricas geradas automaticamente pelo SFT generativo. Para registrá-las, crie uma etapa de avaliação separada que gere respostas do adapter e compare os resultados com um conjunto de avaliação reservado.
