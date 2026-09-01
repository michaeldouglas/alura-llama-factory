---
name: fine-tuning-strategy
description: Define estratégias e hiperparâmetros para fine-tuning de modelos considerando objetivo, dataset, modelo e hardware disponível.
user-invocable: true
---

# Fine-Tuning Strategy

## Objetivo

Definir uma estratégia de fine-tuning adequada ao objetivo do experimento, modelo, dataset e recursos computacionais disponíveis.

## Quando utilizar

Utilize esta skill quando a tarefa envolver:

- escolha da estratégia de treinamento;
- SFT;
- LoRA;
- QLoRA;
- quantização;
- hiperparâmetros;
- planejamento de GPU;
- consumo de memória;
- otimização do treinamento.

## Procedimento

Antes de definir a estratégia:

1. Entenda o objetivo do fine-tuning.
2. Identifique o modelo base.
3. Confirme que o dataset foi validado.
4. Analise o tamanho e formato do dataset.
5. Identifique o hardware disponível.
6. Escolha a estratégia adequada.
7. Defina os hiperparâmetros.
8. Justifique as principais decisões.

## Estratégias

Considere quando apropriado:

### SFT

Utilize Supervised Fine-Tuning quando houver exemplos de entrada e resposta esperada adequados para treinamento supervisionado.

### LoRA

Considere LoRA quando for desejável reduzir o número de parâmetros treináveis e o consumo de recursos.

### QLoRA

Considere QLoRA quando houver maior restrição de memória e o modelo puder ser carregado de forma quantizada.

## Hiperparâmetros

Avalie:

- learning rate;
- epochs;
- batch size;
- gradient accumulation;
- sequence length;
- warmup;
- scheduler;
- precision;
- quantização;
- LoRA rank;
- LoRA alpha;
- LoRA dropout.

## Hardware

Considere:

- GPU disponível;
- VRAM;
- RAM;
- tamanho do modelo;
- tamanho do dataset;
- sequence length;
- batch size;
- precision;
- quantização.

Se a configuração ultrapassar os recursos disponíveis, considere ajustar:

1. batch size;
2. gradient accumulation;
3. sequence length;
4. precision;
5. quantização;
6. estratégia de fine-tuning.

## Regras

- Não escolha hiperparâmetros arbitrariamente.
- Justifique decisões relevantes.
- Não assuma que uma configuração funciona para todos os modelos.
- Considere sempre o hardware disponível.
- Prefira iniciar com configurações conservadoras.
- Preserve as configurações utilizadas nos experimentos.
- Não execute treinamento se o dataset ainda não estiver validado.

## Resultado esperado

Ao finalizar, apresente:

- estratégia escolhida;
- justificativa;
- principais hiperparâmetros;
- requisitos de hardware;
- possíveis limitações;
- configuração recomendada para o experimento.
