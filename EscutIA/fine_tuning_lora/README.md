# Fine-tuning LoRA — EscutIA

Este diretório contém o notebook de treinamento LoRA, a configuração do modelo e os resultados gerados. O treinamento usa a GPU Intel Arc por meio do backend **XPU** do PyTorch e registra as métricas no MLflow.

Nesta etapa, o LoRA não é o LLM conversacional principal. Ele funciona como um **roteador de sentimentos**: recebe um texto, classifica o sentimento e devolve somente um JSON que outro LLM pode consumir para decidir o próximo comportamento.

## Como reproduzir esta etapa

Execute os passos abaixo depois de concluir a preparação e a validação do dataset.

### 1. Abrir a pasta raiz do projeto

Abra um PowerShell e entre na raiz do repositório:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory
```

Se o `.venv` ainda não existir, crie o ambiente base:

```powershell
uv sync --native-tls
```

### 2. Instalar os requirements do fine-tuning

Instale as dependências do LLaMA-Factory, PyTorch/XPU, MLflow e notebooks:

```powershell
.venv\Scripts\python.exe -m pip install -r EscutIA\fine_tuning_lora\requirements.txt
```

O driver da GPU Intel Arc precisa estar instalado no Windows antes desta etapa.

### 3. Confirmar o dataset preparado

Confirme que estes arquivos existem:

```text
EscutIA/dataset/dados/preparados/dataset_info.json
EscutIA/dataset/dados/preparados/escutia_train.json
EscutIA/dataset/dados/preparados/escutia_validation.json
EscutIA/dataset/dados/relatorios/11_validacao_final.json
```

O relatório precisa indicar `DATA_READY_FOR_SFT`. Não inicie o treinamento se o gate não estiver
aprovado.

### 4. Confirmar a GPU

Verifique se o PyTorch encontrou a GPU Intel pelo backend XPU:

```powershell
.venv\Scripts\python.exe -c "import torch; print(torch.__version__); print('XPU:', torch.xpu.is_available()); print(torch.xpu.get_device_name(0) if torch.xpu.is_available() else 'GPU XPU não encontrada')"
```

O resultado esperado deve mostrar `XPU: True`.

### 5. Conferir a configuração

Abra e revise:

```text
EscutIA/fine_tuning_lora/configs/lora_escutia.yaml
```

Confira principalmente o modelo-base, o dataset, `finetuning_type: lora`, `lora_rank`,
`lora_alpha`, `lora_dropout`, batch, learning rate, épocas, precisão e `output_dir`.

### 6. Iniciar o MLflow

Abra um PowerShell separado, mantenha-o aberto e execute:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory
.venv\Scripts\mlflow.exe ui `
  --backend-store-uri "sqlite:///./EscutIA/mlflow.db" `
  --default-artifact-root ".\EscutIA\mlflow-artifacts" `
  --host 127.0.0.1 `
  --port 5000
```

Depois, acesse `http://127.0.0.1:5000`.

### 7. Executar o notebook de treinamento

Em outro PowerShell, ainda na raiz do projeto, inicie o Jupyter:

```powershell
.venv\Scripts\jupyter.exe lab
```

Abra:

```text
EscutIA/fine_tuning_lora/Fine_Tuning_LoRA_EscutIA.ipynb
```

Selecione o kernel do `.venv` e execute as células em ordem. O notebook carrega o modelo-base,
executa o SFT com LoRA, salva checkpoints em `output_dir` e envia as métricas para o MLflow.

Não inicie uma segunda execução usando a mesma pasta de saída. Se precisar de um novo
experimento, altere o `run_name` e o `output_dir` na configuração.

### 8. Registrar e conferir os resultados

Quando a célula de treinamento terminar, execute a célula `Registrar contexto e progresso no
MLflow`. Depois confira:

```text
EscutIA/fine_tuning_lora/outputs/resultados/lora_escutia_router/adapter_model.safetensors
EscutIA/fine_tuning_lora/outputs/resultados/lora_escutia_router/adapter_config.json
EscutIA/fine_tuning_lora/outputs/resultados/lora_escutia_router/checkpoint-*/
```

### 9. Testar a inferência

Somente depois que o adapter existir, abra e execute:

```text
EscutIA/fine_tuning_lora/Inferencia_LoRA_EscutIA.ipynb
```

O notebook de inferência carrega o modelo-base com o adapter treinado. Ele deve devolver o JSON
de sentimento para ser encaminhado ao LLM principal.

## O que fizemos nesta etapa

Depois de preparar e validar o dataset, nós usamos esta pasta para treinar um adapter LoRA com o
LLaMA-Factory. Primeiro definimos o modelo-base Qwen, o template de dados e a tarefa de SFT.
Depois configuramos o LoRA, escolhendo os módulos-alvo e os valores de `rank`, `alpha` e
`dropout`.

Também configuramos os principais parâmetros do treinamento, como batch efetivo, gradient
accumulation, learning rate, scheduler, warmup, épocas e gradient checkpointing. Com isso,
conseguimos executar o treinamento na GPU Intel Arc usando o backend XPU, acompanhando a loss,
as avaliações e os checkpoints gerados durante o processo.

Durante o treinamento, registramos os parâmetros e as métricas no MLflow. Ao final, obtivemos o
adapter LoRA em `outputs/resultados/lora_escutia_router/`, junto com o
`adapter_model.safetensors`, o `adapter_config.json`, o `trainer_log.jsonl` e os checkpoints.
Esse adapter pode ser carregado com o modelo-base no notebook de inferência.

Nesta etapa nós trabalhamos com LoRA. Depois vamos avançar para QLoRA, comparar o consumo de
recursos, ampliar a avaliação, fazer o merge quando necessário e publicar o modelo especializado.

## Papel do modelo na arquitetura

O fluxo esperado depois do treinamento é:

1. A mensagem do usuário é enviada ao roteador LoRA.
2. O roteador devolve o JSON com o sentimento.
3. A aplicação valida o JSON.
4. A aplicação envia o texto original e o sentimento para o LLM principal.
5. O LLM principal gera a resposta conversacional final.

O adapter treinado nesta pasta não deve tentar substituir o LLM principal nem gerar uma conversa completa. Ele deve ser tratado como um componente especializado e determinístico de classificação.

## Detalhes: MLflow

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

## Detalhes: execução do notebook

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
4. Inicia o treinamento LoRA do roteador de sentimentos.
5. Envia parâmetros e métricas para o experimento `escutia-lora` no MLflow.

O notebook já configura automaticamente o mesmo banco SQLite usado pela interface do MLflow. Não é necessário definir manualmente `MLFLOW_TRACKING_URI` quando o treinamento é iniciado por esse notebook.

## Acompanhar o treinamento no MLflow

Com o treinamento em andamento:

1. Acesse `http://127.0.0.1:5000`.
2. Abra o experimento `escutia-lora`.
3. Selecione a execução `lora_escutia_router`.
4. Atualize a página para ver os novos registros.

As métricas são enviadas a cada 10 passos, conforme `logging_steps: 10`. O MLflow permite acompanhar, entre outros dados:

- training loss;
- evaluation loss ao final de cada época;
- learning rate;
- época e número de passos;
- parâmetros da execução;
- duração e status do treinamento.

Depois que a célula de treinamento terminar, execute a célula `Registrar contexto e progresso no MLflow`. Ela complementa a execução com:

- `training_percentage`, calculado a partir de `current_steps / total_steps`;
- hash SHA-256 dos arquivos do dataset preparado;
- decisão do gate de validação;
- plataforma de hardware e estratégia `sft_lora`;
- configuração YAML, relatório do gate e `trainer_log.jsonl` como artefatos.

O MLflow acompanha o treinamento, mas não substitui o notebook nem salva o adapter no lugar dos outputs do LLaMA-Factory.

Accuracy, precision, recall e F1 não são calculados automaticamente nesta etapa, porque o treinamento é SFT generativo. Essas métricas devem ser obtidas em uma avaliação separada com um conjunto de avaliação e um procedimento de geração/classificação definido.

## Onde ficam os resultados

```text
EscutIA/mlflow.db                              # banco dos experimentos
EscutIA/mlflow-artifacts/                      # artefatos registrados pelo MLflow
EscutIA/fine_tuning_lora/outputs/resultados/lora_escutia_router/  # adapter LoRA e checkpoints
```

O notebook de inferência (`Inferencia_LoRA_EscutIA.ipynb`) usa o adapter salvo em `outputs/resultados/lora_escutia_router`. Ele só deve ser executado depois que o treinamento terminar e os arquivos do adapter existirem. A saída deve ser encaminhada ao LLM principal, e não usada como resposta conversacional final.

## Se a máquina for diferente

Não instale as dependências sem revisar a configuração:

- **Outra GPU Intel:** mantenha as versões XPU, instale o driver correto e confirme `torch.xpu.is_available() == True`.
- **GPU NVIDIA:** use as versões CUDA do PyTorch compatíveis com o driver da máquina, remova as versões `+xpu` e revise `bf16`/`fp16` em `configs/lora_escutia.yaml`.
- **CPU:** use a versão comum do PyTorch, altere `bf16: false` e espere um treinamento muito mais lento.
- **Menos memória:** reduza `per_device_train_batch_size`, `cutoff_len` ou o modelo no YAML.

Depois de qualquer alteração nas dependências, atualize o ambiente e repita o teste da GPU.
