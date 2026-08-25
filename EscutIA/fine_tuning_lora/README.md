# Fine-tuning LoRA — EscutIA

## Por que usamos XPU?

Esta configuração usa a GPU Intel Arc por meio do backend **XPU** do PyTorch. Sem XPU, o PyTorch pode executar na CPU e o treinamento fica muito mais lento ou não suporta `bf16`.

## Máquina usada

- Windows x64
- Python 3.12 x64
- GPU Intel Arc 140V com 16 GB
- PyTorch `2.6.0+xpu`
- Precisão `bf16`
- Modelo: `Qwen/Qwen2.5-0.5B-Instruct`

O driver da GPU Intel precisa estar instalado antes da instalação do ambiente.

## Instalação com uv

Abra o PowerShell dentro desta pasta, `fine_tuning_lora`:

```powershell
uv venv --python 3.12 .venv
uv pip install --python .venv\Scripts\python.exe -r requirements.txt
```

Para abrir o notebook usando esse ambiente:

```powershell
.venv\Scripts\jupyter.exe lab
```

Na página do Jupyter, abra `Fine_Tuning_LoRA_EscutIA.ipynb` e execute as células em ordem. O notebook inicia o treinamento automaticamente, sem pedir confirmação.

O dataset preparado precisa existir em:

```text
../dataset/dados/preparados
```

Na primeira execução, o modelo base será baixado do Hugging Face.

## Verificar a GPU antes do treinamento

```powershell
.venv\Scripts\python.exe -c "import torch; print(torch.__version__); print('XPU:', torch.xpu.is_available()); print(torch.xpu.get_device_name(0) if torch.xpu.is_available() else 'GPU XPU não encontrada')"
```

O resultado esperado deve indicar `XPU: True` e a GPU Intel Arc.

## Onde ficam os resultados

```text
outputs/resultados/lora_escutia/  # adapter LoRA e checkpoints
outputs/logs/lora_escutia/       # logs do treinamento
outputs/checkpoints/             # reservado para checkpoints separados
```

## Se a máquina for diferente

Não instale este `requirements.txt` sem revisar:

- **Outra GPU Intel:** mantenha as versões XPU, instale o driver correto e confirme `torch.xpu.is_available() == True`.
- **GPU NVIDIA:** use as versões CUDA do PyTorch compatíveis com o driver da máquina, remova as versões `+xpu` e revise `bf16`/`fp16` no arquivo `configs/lora_escutia.yaml`.
- **CPU:** use a versão comum do PyTorch, altere `bf16: false` e espere um treinamento muito mais lento.
- **Menos memória:** reduza `per_device_train_batch_size`, `cutoff_len` ou o modelo no YAML.

Depois de qualquer alteração, reinstale as dependências no ambiente virtual e faça novamente o teste da GPU.
