# Fine-tuning QLoRA — EscutIA

Esta pasta contém a etapa de demonstração de QLoRA do EscutIA. Ela é independente de
`fine_tuning_lora`: o treinamento LoRA existente permanece como a primeira etapa e este
experimento usa uma GPU NVIDIA no Google Colab para carregar o modelo-base em 4 bits e treinar
um adapter LoRA.

## Objetivo

O objetivo continua sendo adaptar um roteador de sentimentos para classificar textos em português
como `positivo`, `neutro` ou `negativo` e devolver somente um JSON estruturado. A diferença desta
etapa é o carregamento quantizado do modelo-base:

```text
modelo-base Qwen2.5-1.5B-Instruct em 4 bits + adapter LoRA treinável
```

O modelo de 1,5B foi escolhido para tornar o efeito do QLoRA mais visível que no modelo de 0,5B
da etapa LoRA, sem transformar o notebook em um experimento excessivamente pesado.

## Como usar no Google Colab

1. Publique a branch configurada no notebook no repositório GitHub.
2. Abra `Fine_Tuning_QLoRA_EscutIA_Colab.ipynb` no Google Colab.
3. Selecione uma sessão com GPU NVIDIA em **Runtime > Change runtime type**.
4. Clique em **Runtime > Run all**.
5. Aguarde o treinamento, a inferência e a comparação terminarem.
6. Faça backup dos artefatos gerados antes de encerrar a sessão do Colab.

O treinamento está ativado por padrão. Para somente clonar, instalar e validar, altere
`EXECUTE_TRAINING = True` para `False` antes de clicar em **Run all**.

A instalação é feita pelo próprio notebook usando o padrão do Colab. Primeiro são instaladas as
dependências do runtime de treinamento; depois o LLaMA-Factory é instalado com `--no-deps`, porque
o treinamento não precisa da camada web/API e não deve substituir pacotes pré-instalados pelo Colab:

```python
!pip install -q -r /content/alura-llama-factory/EscutIA/fine_tuning_qlora/requirements-colab.txt
!pip install -q --no-deps llamafactory==0.9.5
```

O notebook faz clone do repositório e reutiliza diretamente os arquivos versionados em:

```text
EscutIA/dataset/dados/preparados/
```

Não há uma cópia paralela do dataset nesta pasta. O treinamento só prossegue quando o relatório
`EscutIA/dataset/dados/relatorios/11_validacao_final.json` contém `DATA_READY_FOR_SFT`.

## Arquivos

```text
Fine_Tuning_QLoRA_EscutIA_Colab.ipynb  # treino, inferência, avaliação e comparação no Colab
configs/qlora_escutia.yaml             # configuração do LLaMA-Factory
requirements-colab.txt                 # dependências sem substituir o PyTorch CUDA do Colab
outputs/                               # criado durante a execução; não versionar checkpoints
```

## Configuração QLoRA

O YAML usa `finetuning_type: lora` junto com:

```yaml
quantization_method: bnb
quantization_bit: 4
quantization_type: nf4
double_quantization: true
```

Essa combinação é a diferença operacional entre esta etapa e o LoRA convencional. O LLaMA-Factory
é a interface usada para o treinamento; `bitsandbytes` fornece o backend de quantização no runtime
NVIDIA.

## Dados e saídas

O dataset preparado é o mesmo da etapa anterior:

```text
dataset: escutia_treino
eval_dataset: escutia_validacao
```

Os resultados ficam em:

```text
EscutIA/fine_tuning_qlora/outputs/resultados/qlora_escutia_router/
```

O diretório de saída não deve ser reutilizado para uma nova execução. Para outro experimento,
altere `run_name` e `output_dir` no YAML e preserve os resultados anteriores.

## Inferência, avaliação e comparação no Colab

O próprio `Fine_Tuning_QLoRA_EscutIA_Colab.ipynb` carrega o modelo-base em 4 bits e aplica o
adapter produzido pelo treinamento. Ele testa exemplos prontos, permite informar um texto próprio
e avalia o conjunto congelado sem usar MLflow. Os resultados da avaliação são salvos em
`outputs/avaliacao/avaliacao_qlora.json` e `outputs/avaliacao/avaliacao_qlora.csv`.

Ao final, o notebook compara LoRA e QLoRA no conjunto congelado completo. A comparação calcula
acurácia, F1 macro e taxa de JSON válido e lê dos artefatos de treinamento o loss de validação, a
duração e o tamanho de cada adapter. A execução QLoRA também registra o pico de memória da GPU por
amostragem durante o treinamento; a execução LoRA histórica não possui essa medição, por isso o
relatório marca esse campo como não registrado. Os arquivos ficam em
`outputs/comparacao/comparacao_lora_qlora.json` e `outputs/comparacao/comparacao_lora_qlora.csv`.

Essa etapa é executada automaticamente na sequência do treinamento, no mesmo runtime. O modelo
continua no cache da sessão, o adapter é carregado de `outputs/resultados/qlora_escutia_router` e o
dataset de avaliação já existente no clone é reutilizado sem nenhuma ação manual adicional.

A última célula cria e baixa automaticamente `outputs/escutia-qlora-huggingface.zip`. O pacote contém
uma seleção limpa dos arquivos necessários para publicar o adapter no Hugging Face, incluindo
tokenizer, configuração, manifesto, métricas e um Model Card. Checkpoints e arquivos de otimização
ficam fora do ZIP.

## Limitações conhecidas

- O notebook foi desenhado para GPU NVIDIA no Colab; ele não substitui a execução XPU da etapa
  LoRA.
- O tipo de GPU e a memória disponíveis no Colab variam. O notebook interrompe o fluxo antes do
  treinamento se não detectar CUDA.
- A sessão do Colab é temporária. Salve o adapter em `/content`, faça download ou copie-o para o
  Google Drive antes de desconectar.
- O repositório precisa estar acessível pela URL configurada. Para repositório privado, use uma
  autenticação segura no ambiente do Colab e não grave tokens no notebook.
- O notebook começa com `EXECUTE_TRAINING = True`; use `False` para executar apenas a preparação e
  as validações.

## Referências técnicas

A configuração segue os argumentos de quantização documentados na versão `llamafactory==0.9.5`
(`quantization_bit`, `quantization_method`, `quantization_type` e `double_quantization`). O modelo
Qwen está fixado no YAML pela revisão `989aa79`.
