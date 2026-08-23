# Curso prático — treinamento do modelo EscutIA

Esta pasta contém somente a etapa de treinamento do modelo que será usado como uma capacidade do agente EscutIA. O README oficial do produto está em `..\README.md`; a explicação técnica desta etapa está em [ENTENDENDO_O_PROJETO.md](ENTENDENDO_O_PROJETO.md).

O pacote é autônomo: depois de baixá-lo, a pessoa instala os pacotes, baixa o modelo e o dataset, prepara os dados, executa o treinamento e testa o resultado sem depender de Codex, agentes ou de outra pasta do repositório.

## O que será treinado

- Modelo base: `Qwen/Qwen2.5-0.5B-Instruct`.
- Dataset: Cardiff NLP, configuração portuguesa.
- Tarefa: classificar textos em `positivo`, `neutro` ou `negativo`.
- Estratégia: SFT com LoRA.
- Hardware previsto: Windows, Python 3.12 de 64 bits e Intel XPU.

## 1. Abrir o PowerShell

Entre nesta pasta:

```powershell
Set-Location "C:\caminho\para\EscutIA\treinamentoModelo"
```

Confirme o Python:

```powershell
python --version
```

O esperado é `Python 3.12.x`. Não use Python 3.14 para este curso.

## 2. Criar o ambiente e instalar os pacotes

```powershell
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Confirme:

```powershell
python -c "import torch, transformers, peft; print('torch:', torch.__version__); print('transformers:', transformers.__version__); print('peft:', peft.__version__); print('xpu:', torch.xpu.is_available())"
llamafactory-cli version
```

O valor de `xpu` precisa ser `True` para repetir o treinamento validado. Não use fallback silencioso para CPU.

## 3. Baixar o modelo base

```powershell
python scripts\baixar_modelo.py
```

O modelo será salvo em:

```text
models\Qwen--Qwen2.5-0.5B-Instruct
```

## 4. Baixar e preparar o dataset

```powershell
python scripts\preparar_dataset.py
```

O script baixa os três splits portugueses, verifica SHA-256, preserva a fonte em `data\source`, prepara os registros Alpaca em `data\derived`, verifica duplicatas e grava a linhagem da transformação.

O treinamento usa somente `data\derived`; a fonte original fica separada.

## 5. Executar o treinamento

```powershell
python scripts\treinar.py --confirm
```

O script cria uma saída nova em `outputs`, grava a configuração usada, salva os logs e aplica limite máximo de 60 minutos. A confirmação `--confirm` evita iniciar um treino acidentalmente.

Ao terminar, o resultado ficará parecido com:

```text
outputs\sft-lora-20260822-01\checkpoint-224
outputs\sft-lora-20260822-01\checkpoint-448
```

O maior checkpoint normalmente é o final. O script também cria:

```text
outputs\ULTIMO_TREINAMENTO.txt
```

Esse arquivo informa o caminho exato do checkpoint e o comando pronto para testar. Para uma explicação visual, leia [COMO_ENCONTRAR_O_MODELO.md](COMO_ENCONTRAR_O_MODELO.md).

O resultado do fine-tuning é um adapter LoRA. Ele precisa ser usado junto com o modelo base em `models`; o script de teste faz isso automaticamente.

## 6. Testar o modelo treinado

Para testar uma frase:

```powershell
python scripts\testar_modelo.py --text "Este produto melhorou muito a minha rotina."
```

Para entrar no modo interativo:

```powershell
python scripts\testar_modelo.py
```

O programa encontra automaticamente o último checkpoint. Para indicar um checkpoint específico:

```powershell
python scripts\testar_modelo.py --adapter "outputs\sft-lora-20260822-01\checkpoint-448" --text "Gostei bastante do resultado."
```

## Estrutura depois da execução

```text
treinamentoModelo/
├── .venv/                           # ambiente local
├── models/                          # modelo base
├── data/source/                     # fonte baixada
├── data/derived/                    # dataset preparado
├── outputs/                         # adapter, checkpoints e logs
├── config/sft-lora-template.yaml
├── scripts/
├── requirements.txt
└── README.md
```

## Problemas comuns

- `python` não encontrado: instale Python 3.12 de 64 bits e abra outro terminal.
- `xpu: False`: verifique o driver Intel e a instalação dos wheels XPU.
- saída já existe: use `--output-name outro-nome` no treinamento.
- memória insuficiente: feche outros aplicativos e não aumente batch ou sequência sem revisar o consumo.
- treinamento passou de 60 minutos: os logs ficam preservados na saída para investigação.
