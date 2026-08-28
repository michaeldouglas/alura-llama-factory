---
name: llama-factory
description: Orienta configuração, treinamento, avaliação, inferência e exportação de modelos utilizando LLaMA-Factory.
user-invocable: true
---

# LLaMA-Factory

## Objetivo

Fornecer procedimentos para trabalhar com LLaMA-Factory durante experimentos de fine-tuning.

## Quando utilizar

Utilize esta skill quando a tarefa envolver:

- configuração do LLaMA-Factory;
- criação ou revisão de arquivos YAML;
- SFT;
- LoRA;
- QLoRA;
- execução de treinamento;
- checkpoints;
- inferência;
- avaliação;
- exportação do modelo.

## Procedimento

Antes de configurar um treinamento:

1. Identifique o modelo base.
2. Confirme que o dataset foi validado.
3. Identifique a estratégia de fine-tuning definida.
4. Verifique os recursos computacionais disponíveis.
5. Prepare a configuração do LLaMA-Factory.
6. Valide a configuração antes da execução.

## Configuração

Ao criar ou revisar uma configuração, verifique:

- modelo base;
- dataset;
- template;
- estágio de treinamento;
- método de fine-tuning;
- quantização;
- precisão;
- sequence length;
- batch size;
- gradient accumulation;
- learning rate;
- epochs;
- scheduler;
- warmup;
- LoRA rank;
- LoRA alpha;
- LoRA dropout;
- diretório de saída;
- estratégia de checkpoints.

## Regras

- Não invente parâmetros desconhecidos do LLaMA-Factory.
- Não execute treinamento com dataset não validado.
- Não sobrescreva checkpoints existentes sem necessidade.
- Não altere o modelo base original.
- Preserve as configurações utilizadas em cada experimento.
- Prefira configurações reproduzíveis.
- Considere sempre as limitações do hardware disponível.
- Quando houver dúvida sobre uma opção do LLaMA-Factory, consulte a documentação disponível antes de utilizá-la.

## Resultado esperado

Produzir configurações e procedimentos reproduzíveis para execução de fine-tuning utilizando LLaMA-Factory.
