---
library_name: peft
license: other
base_model: Qwen/Qwen2.5-0.5B-Instruct
tags:
- base_model:adapter:Qwen/Qwen2.5-0.5B-Instruct
- llama-factory
- lora
- transformers
pipeline_tag: text-generation
model-index:
- name: lora_escutia_router
  results: []
---

<!-- This model card has been generated automatically according to the information the Trainer had access to. You
should probably proofread and complete it, then remove this comment. -->

# lora_escutia_router

This model is a fine-tuned version of [Qwen/Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) on the escutia_treino dataset.
It achieves the following results on the evaluation set:
- Loss: 0.0847

## Model description

More information needed

## Intended uses & limitations

More information needed

## Training and evaluation data

More information needed

## Training procedure

### Training hyperparameters

The following hyperparameters were used during training:
- learning_rate: 0.0001
- train_batch_size: 1
- eval_batch_size: 1
- seed: 42
- gradient_accumulation_steps: 8
- total_train_batch_size: 8
- optimizer: Use OptimizerNames.ADAMW_TORCH with betas=(0.9,0.999) and epsilon=1e-08 and optimizer_args=No additional optimizer arguments
- lr_scheduler_type: cosine
- lr_scheduler_warmup_ratio: 0.05
- num_epochs: 2.0

### Training results

| Training Loss | Epoch | Step | Validation Loss |
|:-------------:|:-----:|:----:|:---------------:|
| 0.0884        | 1.0   | 230  | 0.0867          |
| 0.0803        | 2.0   | 460  | 0.0847          |


### Framework versions

- PEFT 0.18.1
- Transformers 4.57.6
- Pytorch 2.6.0+xpu
- Datasets 3.6.0
- Tokenizers 0.22.2