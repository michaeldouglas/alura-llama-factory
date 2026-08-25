# MLflow — EscutIA

O MLflow acompanha cada treinamento LoRA como um experimento comparável. Ele mostra loss, learning rate, parâmetros, épocas, passos e duração enquanto o treinamento acontece.

## 1. Instalar o ambiente

Na raiz do projeto:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory
uv sync --native-tls
```

Se o ambiente `.venv` já existir, o `uv sync` apenas confirma ou atualiza as dependências.

O projeto instala o PyTorch com suporte XPU para a GPU Intel Arc e o MLflow.

## 2. Subir a interface do MLflow

Na raiz do projeto, execute:

```powershell
.venv\Scripts\mlflow.exe ui `
  --backend-store-uri .\EscutIA\mlflow `
  --host 127.0.0.1 `
  --port 5000
```

Abra no navegador:

```text
http://127.0.0.1:5000
```

Deixe esse terminal aberto durante o treinamento.

## 3. Executar o treinamento

Em outro terminal, na raiz do projeto, abra o Jupyter:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory
.venv\Scripts\jupyter.exe lab
```

Abra `EscutIA\fine_tuning_lora\Fine_Tuning_LoRA_EscutIA.ipynb` e execute as células em ordem.

O notebook aponta automaticamente para esta pasta (`EscutIA\mlflow`). Não é necessário configurar a variável `MLFLOW_TRACKING_URI` manualmente.

## 4. Ver o treinamento em andamento

1. Inicie o MLflow.
2. Inicie o Jupyter.
3. Execute o notebook de treinamento.
4. Acesse `http://127.0.0.1:5000`.
5. Abra o experimento `escutia-lora`.

As métricas são enviadas a cada 10 passos, conforme `logging_steps: 10`. Atualize a página para acompanhar novos registros.

O adapter e os checkpoints continuam sendo salvos em:

```text
fine_tuning_lora/outputs/resultados/lora_escutia/
```

O MLflow registra métricas e parâmetros; ele não substitui o `Inferencia_LoRA_EscutIA.ipynb`, que continua sendo usado para testar as respostas do modelo.

## Observação

O treinamento interrompido antes desta configuração não aparece automaticamente no MLflow. Ele continua disponível em `fine_tuning_lora/outputs/`; apenas os treinamentos iniciados com esta configuração serão registrados como experimentos.
