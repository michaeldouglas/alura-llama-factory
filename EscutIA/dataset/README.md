# Dataset EscutIA — saída JSON

Esta é a versão do dataset de análise de sentimentos usada pelo EscutIA. Todos os arquivos necessários para preparar e validar os dados ficam dentro de `EscutIA/dataset/`.

## Objetivo

Manter a mesma tarefa e os mesmos rótulos do dataset original:

- `negativo`
- `neutro`
- `positivo`

A diferença é que a resposta esperada agora é um JSON válido, adequado para ser validado e consumido por uma aplicação antes de chamar um modelo maior:

```json
{"sentimento":"positivo"}
```

Esta versão não classifica intenção nem nível de risco, porque o dataset original não possui anotações confiáveis para esses campos.

## Como reproduzir esta etapa

Execute os passos abaixo na ordem. Os comandos foram escritos para Windows e usam o `.venv` da
raiz do projeto.

### 1. Abrir a pasta do projeto

Abra um PowerShell e entre na pasta do dataset:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory\EscutIA\dataset
```

Se o ambiente virtual ainda não existir, volte para a raiz e crie-o com `uv sync`:

```powershell
cd ..\..
uv sync --native-tls
cd EscutIA\dataset
```

### 2. Instalar os requirements do dataset

Instale as dependências usadas pelos scripts e notebooks desta pasta:

```powershell
..\..\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 3. Criar as pastas de trabalho

As pastas normalmente já existem no repositório. Se estiver reproduzindo a partir de uma cópia
limpa, crie-as com:

```powershell
New-Item -ItemType Directory -Force dados\preparados, dados\trabalho, dados\relatorios
```

Não altere os arquivos originais em `dados\dataset.csv` e `dados\dataset_local.csv`.

### 4. Executar os notebooks

Ainda dentro de `EscutIA\dataset`, inicie o Jupyter:

```powershell
..\..\.venv\Scripts\jupyter.exe lab
```

No Jupyter, execute os notebooks nesta ordem:

1. `Dataset_EscutIA.ipynb`
2. `Analise_DataSet_EscutIA.ipynb`

No primeiro notebook, execute as células desde o início. Ele prepara os dados, faz a limpeza,
remove duplicidades, separa treino/validação/avaliação, gera os formatos do LLaMA-Factory e
executa a validação final. O segundo notebook analisa os resultados e as distribuições.

### 5. Validar o resultado

Depois dos notebooks, valide novamente pelo terminal:

```powershell
..\..\.venv\Scripts\python.exe scripts\validar_dataset.py
```

Continue para o treinamento somente se o relatório indicar `DATA_READY_FOR_SFT` e os arquivos
preparados existirem em `dados\preparados\`.

Se preferir reproduzir a preparação sem Jupyter, use o script equivalente:

```powershell
..\..\.venv\Scripts\python.exe scripts\preparar_dataset.py
..\..\.venv\Scripts\python.exe scripts\validar_dataset.py
```

## O que fizemos nesta etapa

Nesta pasta nós preparamos os dados que serão usados no fine-tuning. Primeiro trabalhamos com
as fontes locais do EscutIA e mantivemos o dataset original preservado. Depois inspecionamos a
estrutura dos registros, conferimos os campos disponíveis e verificamos se os exemplos estavam
adequados para a tarefa de classificação de sentimentos.

Em seguida, nós limpamos e normalizamos os dados, identificamos registros inválidos,
duplicidades e inconsistências, e organizamos cada exemplo no formato de instrução, contexto e
resposta. Também separamos os dados em conjuntos de treinamento, validação e avaliação, mantendo
a avaliação isolada para ser usada depois na comparação do modelo-base com o modelo adaptado.

Por fim, geramos os formatos compatíveis com o LLaMA-Factory, validamos os arquivos produzidos e
executamos o gate `DATA_READY_FOR_SFT`. Isso significa que, ao concluir esta etapa, o dataset
está preparado para ser consumido pelo treinamento em `EscutIA/fine_tuning_lora/`.

## Fontes locais

As fontes usadas pelo dataset são mantidas dentro desta pasta:

```text
EscutIA/dataset/dados/dataset.csv
EscutIA/dataset/dados/dataset_local.csv
```

Assim, a execução começa somente com os arquivos desta pasta. As pastas `dados/preparados/`, `dados/trabalho/` e `dados/relatorios/` começam vazias, exceto pelos arquivos `.gitkeep`, e serão preenchidas pelo primeiro notebook.

## Saídas

```text
EscutIA/dataset/dados/preparados/escutia_train.json
EscutIA/dataset/dados/preparados/escutia_validation.json
EscutIA/dataset/dados/preparados/escutia_evaluation.json
EscutIA/dataset/dados/preparados/escutia_train_conversacional.json
EscutIA/dataset/dados/preparados/escutia_validation_conversacional.json
EscutIA/dataset/dados/preparados/escutia_evaluation_conversacional.json
EscutIA/dataset/dados/preparados/dataset_info.json
```

O treinamento não faz parte desta etapa. Depois que a validação for revisada, o `fine_tuning_lora` poderá usar os arquivos preparados neste diretório.
