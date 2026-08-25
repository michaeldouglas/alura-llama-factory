# Fine-tuning LoRA — EscutIA

Este diretório contém o notebook de treinamento LoRA, a configuração do modelo e os resultados gerados. O treinamento usa a GPU Intel Arc por meio do backend **XPU** do PyTorch e registra as métricas no MLflow.

## Pré-requisitos

- Windows x64
- Python 3.12 x64
- Driver da GPU Intel instalado
- GPU Intel Arc com memória suficiente para a configuração
- Dataset preparado e aprovado para SFT

A configuração de referência usa:

- PyTorch `2.6.0+xpu`
- Precisão `bf16`
- Modelo `Qwen/Qwen2.5-0.5B-Instruct`

## 1. Preparar o ambiente

Execute os comandos a partir da raiz do repositório, e não de dentro de `fine_tuning_lora`:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory
uv sync --native-tls
```

O comando cria ou atualiza o ambiente `.venv` da raiz com PyTorch/XPU, LLaMA-Factory, MLflow, Jupyter e as demais dependências do projeto.

## 2. Confirmar a GPU

Antes de iniciar o notebook, valide se o PyTorch encontrou a GPU Intel:

```powershell
.venv\Scripts\python.exe -c "import torch; print(torch.__version__); print('XPU:', torch.xpu.is_available()); print(torch.xpu.get_device_name(0) if torch.xpu.is_available() else 'GPU XPU não encontrada')"
```

O resultado esperado deve indicar `XPU: True` e exibir o nome da GPU. Se aparecer `XPU: False`, corrija o driver ou o ambiente antes de iniciar o treinamento.

## 3. Conferir o dataset

O notebook espera o dataset preparado em:

```text
EscutIA/dataset/dados/preparados/
```

Os arquivos obrigatórios são:

```text
dataset_info.json
escutia_train.json
escutia_validation.json
```

Também deve existir o relatório de validação:

```text
EscutIA/dataset/dados/relatorios/11_validacao_final.json
```

O relatório precisa indicar `DATA_READY_FOR_SFT`. O notebook bloqueia o treinamento quando o dataset não está preparado ou aprovado.

## 4. Iniciar o MLflow

O MLflow armazena os experimentos em SQLite. Isso evita o erro do filesystem backend legado e mantém o banco separado do dataset.

Abra um PowerShell na raiz do repositório e execute:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory

.venv\Scripts\mlflow.exe ui `
  --backend-store-uri "sqlite:///./EscutIA/mlflow.db" `
  --default-artifact-root ".\EscutIA\mlflow-artifacts" `
  --host 127.0.0.1 `
  --port 5000
```

Mantenha esse terminal aberto e acesse:

```text
http://127.0.0.1:5000
```

Não é necessário executar o notebook antes de iniciar o MLflow. O MLflow pode ser iniciado sem nenhum treinamento existente; os experimentos aparecerão quando o notebook enviar a primeira execução.

## 5. Executar o notebook de treinamento

Abra um segundo PowerShell na raiz do repositório:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory
.venv\Scripts\jupyter.exe lab
```

No Jupyter, abra:

```text
EscutIA/fine_tuning_lora/Fine_Tuning_LoRA_EscutIA.ipynb
```

Execute as células em ordem. O notebook:

1. Localiza e valida o dataset preparado.
2. Confere o gate `DATA_READY_FOR_SFT`.
3. Carrega o modelo base do Hugging Face na primeira execução.
4. Inicia o treinamento LoRA.
5. Envia parâmetros e métricas para o experimento `escutia-lora` no MLflow.

O notebook já configura automaticamente o mesmo banco SQLite usado pela interface do MLflow. Não é necessário definir manualmente `MLFLOW_TRACKING_URI` quando o treinamento é iniciado por esse notebook.

## 6. Acompanhar o treinamento no MLflow

Com o treinamento em andamento:

1. Acesse `http://127.0.0.1:5000`.
2. Abra o experimento `escutia-lora`.
3. Selecione a execução `lora_escutia`.
4. Atualize a página para ver os novos registros.

As métricas são enviadas a cada 10 passos, conforme `logging_steps: 10`. O MLflow permite acompanhar, entre outros dados:

- training loss;
- evaluation loss, quando disponível;
- learning rate;
- época e número de passos;
- parâmetros da execução;
- duração e status do treinamento.

O MLflow acompanha o treinamento, mas não substitui o notebook nem salva o adapter no lugar dos outputs do LLaMA-Factory.

## 7. Onde ficam os resultados

```text
EscutIA/mlflow.db                              # banco dos experimentos
EscutIA/mlflow-artifacts/                      # artefatos registrados pelo MLflow
EscutIA/fine_tuning_lora/outputs/resultados/lora_escutia/  # adapter LoRA e checkpoints
EscutIA/fine_tuning_lora/outputs/logs/lora_escutia/        # logs do treinamento
EscutIA/fine_tuning_lora/outputs/checkpoints/              # checkpoints separados
```

O notebook de inferência (`Inferencia_LoRA_EscutIA.ipynb`) usa o adapter salvo em `outputs/resultados/lora_escutia`. Ele só deve ser executado depois que o treinamento terminar e os arquivos do adapter existirem.

## Se a máquina for diferente

Não instale as dependências sem revisar a configuração:

- **Outra GPU Intel:** mantenha as versões XPU, instale o driver correto e confirme `torch.xpu.is_available() == True`.
- **GPU NVIDIA:** use as versões CUDA do PyTorch compatíveis com o driver da máquina, remova as versões `+xpu` e revise `bf16`/`fp16` em `configs/lora_escutia.yaml`.
- **CPU:** use a versão comum do PyTorch, altere `bf16: false` e espere um treinamento muito mais lento.
- **Menos memória:** reduza `per_device_train_batch_size`, `cutoff_len` ou o modelo no YAML.

Depois de qualquer alteração nas dependências, atualize o ambiente e repita o teste da GPU.
