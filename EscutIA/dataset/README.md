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

## Fontes locais

As fontes usadas pelo dataset são mantidas dentro desta pasta:

```text
EscutIA/dataset/dados/dataset.csv
EscutIA/dataset/dados/dataset_local.csv
```

Assim, a execução começa somente com os arquivos desta pasta. As pastas `dados/preparados/`, `dados/trabalho/` e `dados/relatorios/` começam vazias, exceto pelos arquivos `.gitkeep`, e serão preenchidas pelo primeiro notebook.

## Preparar o ambiente

Com o repositório já baixado, instale as dependências do dataset no ambiente virtual do projeto:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory\EscutIA\dataset
..\..\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Se você já executou `uv sync --native-tls` na raiz do projeto, as dependências listadas aqui já fazem parte do ambiente e esta instalação é apenas uma conferência.

## Reprodução por script

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory\EscutIA\dataset
..\..\.venv\Scripts\python.exe scripts\preparar_dataset.py
```

O script usa apenas as fontes locais do dataset e falha se a saída já possuir artefatos, evitando sobrescrita silenciosa. Para começar novamente, execute `scripts\limpar_resultados_preparacao.py`; ele remove somente os resultados gerados e preserva as fontes.

## Executar tudo pelo Jupyter

Abra o Jupyter a partir desta pasta:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory\EscutIA\dataset
..\..\.venv\Scripts\jupyter.exe lab
```

Execute os notebooks nesta ordem, sempre a partir de `EscutIA/dataset`:

1. `Dataset_EscutIA.ipynb`
2. `Analise_DataSet_EscutIA.ipynb`

O primeiro reproduz o roteiro didático completo da preparação: obtém a fonte local/unificada, inspeciona o schema, organiza, limpa, revisa alertas, remove duplicidades, divide os dados, congela a avaliação, gera os formatos do LLaMA-Factory e executa a validação final. O segundo faz a análise estatística com tabelas, gráficos, distribuição, tamanho dos textos, rejeitados, duplicidades, formatos e gate. Nenhum deles executa treinamento.

Se os artefatos ainda não existirem, a primeira execução do `Dataset_EscutIA.ipynb` os criará. Se você executar o notebook novamente, mantenha a limpeza inicial para reiniciar a aula desde o começo.

Depois da análise pelo notebook, a mesma validação também pode ser executada sem Jupyter:

```powershell
..\..\.venv\Scripts\python.exe scripts\validar_dataset.py
```

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
