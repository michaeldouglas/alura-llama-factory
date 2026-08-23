# G5 — Estratégia e viabilidade

**Estado:** `PROPOSAL_ONLY` — proposta não autorizada para revisão do orchestrator  
**Gate de dados usado:** `G4-DERIVED = DATA_READY` somente para o candidato `transformation-v1`  
**Gate de dados original:** `G4 = DATA_BLOCKED` permanece preservado  
**Escopo desta entrega:** T047; nenhuma carga de modelo/tokenizer, inferência, baseline, dry run,
treinamento ou criação de checkpoint foi executada.

## Objetivo

Realizar, em uma futura execução autorizada, SFT para classificar textos curtos em português em
exatamente uma palavra entre `negativo`, `neutro` e `positivo`. O primeiro experimento deve ser
pequeno, reproduzível e limitado a uma única máquina local, sem computação remota ou paga e com
limite de 60 minutos para o principal run.

## Modelo base

- Repositório: `Qwen/Qwen2.5-0.5B-Instruct`.
- Revisão imutável: `7ae557604adf67be50417f59c2c2f167def9a775`.
- Tamanho reportado: aproximadamente `0,49B` parâmetros.
- Licença registrada: Apache-2.0.
- Cache externo observado: `C:/Users/mdbaa/AppData/Local/alura-llama-factory/001-resource-efficient-finetune/cache/model/Qwen--Qwen2.5-0.5B-Instruct/7ae557604adf67be50417f59c2c2f167def9a775/`.
- Payload externo registrado: `999.604.126` bytes em dez arquivos.

O modelo foi recuperado e hash-verificado no cache externo, mas **não foi carregado**. Não há
compatibilidade de forward, tokenizer, template ou inferência validada nesta etapa. O fato de as
operações sintéticas XPU terem produzido valores finitos não é evidência de compatibilidade do
modelo com o runtime.

## Dataset validado usado na proposta

O objeto permitido para G5 é o derivado separado `transformation-v1`:

- Fonte: `cardiffnlp/tweet_sentiment_multilingual`, configuração `portuguese`.
- Revisão da fonte: `606156db529f327fd871515cccbe14dcbafef682`.
- Derivado: `transformation-v1`, em armazenamento externo, sem mutar a fonte.
- Treino: `1.792` registros — `586` negativo, `603` neutro, `603` positivo.
- Validação: `314` registros — `104` negativo, `105` neutro, `105` positivo.
- Teste congelado: `854` registros — `279` negativo, `289` neutro, `286` positivo.
- Schema: UTF-8 JSONL Alpaca SFT com `instruction`, `input` e `output`.
- Instrução congelada: `Classifique o sentimento do texto em exatamente uma palavra: positivo, neutro ou negativo.`
- A decisão `G4-DERIVED = DATA_READY` cobre schema, contagens, isolamento entre splits,
  linhagem e hashes do derivado. Ela não substitui o relatório original `G4 = DATA_BLOCKED`.
- A licença CC BY 3.0 e as restrições aplicáveis ao conteúdo de X/Twitter continuam sendo riscos
  de revisão do orchestrator; não são apagadas pela transformação.

O caminho de dados proposto é externo:
`C:/Users/mdbaa/AppData/Local/alura-llama-factory/001-resource-efficient-finetune/data-derived/cardiffnlp--tweet_sentiment_multilingual/606156db529f327fd871515cccbe14dcbafef682/transformation-v1/`.
O registro `dataset_info.json` compatível com o parser do LLaMA-Factory ainda deve ser confirmado
em T049; T048 não cria nem modifica esse artefato.

## Hardware e runtime observados

- Sistema de execução planejado: Windows nativo, uma máquina local.
- Python: `3.12.12`, CPython 64-bit.
- PyTorch: `2.9.1+xpu`.
- LLaMA-Factory observado no ambiente: `0.9.5`.
- Acelerador: `1 XPU`, Intel Arc 140V, `16 GB` de memória compartilhada reportada.
- Operações sintéticas XPU finitas: criação de tensor, multiplicação de matrizes, embedding,
  normalização, loss, backward, optimizer step e verificações de gradiente.
- CPU: somente diagnóstico; não é fallback autorizado.
- Modelo/tokenizer: não carregados; não houve forward ou backward do Qwen.

O runtime sintético é uma pré-condição útil, não uma validação de compatibilidade do candidato.
O risco principal continua sendo a combinação de memória compartilhada, kernels XPU, dtype e
execução real do modelo.

## Estratégia proposta

### SFT + LoRA conservadora

Escolho SFT porque cada registro já contém uma instrução, um texto e uma resposta categórica
esperada. Escolho LoRA porque o objetivo é um primeiro experimento de baixo custo e o modelo base
deve permanecer congelado, reduzindo parâmetros treináveis, estados do otimizador e escrita dos
checkpoints. A adaptação fica limitada aos quatro projetos de atenção (`q_proj`, `k_proj`,
`v_proj`, `o_proj`), reduzindo o risco de sobreajuste em 1.792 exemplos.

QLoRA/quantização não foi escolhida: o plano não assume bitsandbytes ou quantização validada para
Intel Arc/XPU, e o modelo ainda não passou por carregamento real. A proposta usa bf16 sem declarar
que o dtype já foi validado no Qwen.

## Hiperparâmetros completos e justificativas

| Parâmetro | Proposta | Justificativa |
|---|---:|---|
| `seed` | `42` | Reproduzibilidade e comparação controlada. |
| `stage` | `sft` | Compatível com o schema Alpaca supervisionado. |
| `finetuning_type` | `lora` | Reduz memória e parâmetros treináveis. |
| `template` | `qwen` | Template ChatML/Qwen registrado no LLaMA-Factory; compatibilidade concreta ainda depende de T049. |
| `cutoff_len` | `256` | Textos têm limite de 280 caracteres; reserva contexto para instrução e marcadores sem pagar o custo de 512/1024 tokens. Deve ser confirmado após tokenização real. |
| `per_device_train_batch_size` | `1` | Microbatch mínimo para uma XPU integrada e memória compartilhada. |
| `gradient_accumulation_steps` | `8` | Batch efetivo 8 sem aumentar o pico do microbatch. |
| `per_device_eval_batch_size` | `1` | Mantém a mesma margem de memória na validação. |
| `learning_rate` | `1e-4` | Taxa moderada para LoRA em dataset pequeno; reduz mudanças bruscas e instabilidade. |
| `num_train_epochs` | `2.0` | Dois passes dão sinal inicial suficiente e reduzem sobreajuste e duração frente a 3+ épocas. |
| `lr_scheduler_type` | `cosine` | Decaimento suave para o pequeno número de atualizações. |
| `warmup_ratio` | `0.05` | Aproximadamente 22 updates de aquecimento em 448 updates projetados. |
| `optim` | `adamw_torch` | Otimizador padrão do PyTorch, sem depender de bitsandbytes no XPU. |
| `weight_decay` | `0.01` | Regularização leve para limitar sobreajuste. |
| `max_grad_norm` | `1.0` | Proteção contra explosão de gradiente. |
| `lora_target` | `q_proj,k_proj,v_proj,o_proj` | Atenção apenas; escopo menor e mais previsível que todos os lineares. |
| `lora_rank` | `8` | Capacidade suficiente para um primeiro classificador sem inflar estados treináveis. |
| `lora_alpha` | `16` | Escala 2× o rank, mantendo a atualização LoRA moderada. |
| `lora_dropout` | `0.05` | Regularização pequena, adequada ao conjunto reduzido. |
| `bf16` / `fp16` | `true` / `false` | Reduz armazenamento e ativação; precisa de confirmação no caminho real do modelo. |
| `pure_bf16` | `false` | Mantém AMP como mitigação de estabilidade enquanto o dtype não foi medido no modelo. |
| `gradient_checkpointing` | `true` | Diminui ativações residentes; aceita aumento de tempo para proteger memória. |
| `dataloader_num_workers` | `0` | Evita custo/processos extras no Windows e torna o primeiro run mais previsível. |
| `eval_strategy` | `epoch` | Duas avaliações, sem a frequência de I/O de avaliação por steps. |
| `save_strategy` | `epoch` | Um checkpoint por época, alinhado ao ciclo curto. |
| `save_total_limit` | `2` | Retém apenas os dois checkpoints da proposta, sem acumulação indefinida. |
| `save_safetensors` | omitido | O parser LLaMA-Factory 0.9.5 rejeitou essa chave na proposta; a política de formato do adapter permanece para a revisão G6. |
| `overwrite_output_dir` | `false` | Recusa caminho de saída existente; não sobrescreve resultados anteriores. |
| `logging_steps` | `10` | Log frequente para detectar loss não finita e degradação sem grande I/O. |

O batch efetivo projetado é `1 × 8 = 8`. Isso produz `224` updates por época e `448` updates em
duas épocas, antes de qualquer efeito de arredondamento do trainer. O conjunto de validação é
usado somente para acompanhamento; o `frozen-test` permanece reservado para a avaliação posterior.

## Memória, duração e envelope

Estas são estimativas de planejamento, não medições:

- Pesos bf16 crus de 0,49B parâmetros: aproximadamente `0,98 GB` antes de overheads.
- Pico de trabalho previsto para modelo + LoRA + ativações + runtime XPU, com batch 1, cutoff 256
  e checkpointing: aproximadamente `8–12 GiB` de memória XPU compartilhada. A margem restante
  dentro dos `16 GB` reportados é necessária para allocator, kernels e sistema; OOM continua possível.
- Duração principal estimada: aproximadamente `25–50 minutos`, incluindo duas avaliações e dois
  checkpoints, com baixa confiança por não existir ainda um microbatch real medido. O limite
  obrigatório continua sendo 60 minutos; T053 deve substituir esta projeção por evidência.
- Espaço externo: o cache do modelo já registra `999.604.126` bytes; logs, estados e até dois
  checkpoints devem permanecer no run externo e não entram no controle de versão.

O envelope não é considerado compatível até que T049/T050 e a revisão G6 confirmem carregamento,
memória e schema. Não há autorização para executar a configuração nesta entrega.

## Riscos específicos de XPU

- Operações sintéticas finitas não cobrem o forward/backward do Qwen, a combinação Qwen + PEFT,
  o template ou o tokenizer.
- A Arc 140V é integrada; memória compartilhada, fragmentação e pressão do sistema podem reduzir
  a margem muito abaixo dos 16 GB nominais.
- Um kernel ou dtype sem suporte pode gerar fallback implícito para CPU, erro, valores não finitos
  ou uma duração acima do orçamento. Fallback silencioso não é permitido.
- Gradient checkpointing poupa memória, mas pode tornar a projeção de tempo conservadora insuficiente.
- O estado do dataset original continua bloqueado; somente o derivado identificado pode ser usado
  na revisão, e a linhagem/licença devem continuar visíveis.

## Stop conditions

O futuro executor deve parar antes de qualquer passo adicional e preservar apenas evidência segura
se ocorrer qualquer condição abaixo:

- ausência, expiração ou divergência de G6/G7, ou configuração/hash diferente da proposta revisada;
- `G4-DERIVED` diferente de `DATA_READY`, hash/schema/linhagem do derivado divergente, ou tentativa
  de usar o objeto original `G4 DATA_BLOCKED`;
- modelo, tokenizer, template ou registro externo do dataset incompatível;
- XPU indisponível, mais de um device inesperado, operação em CPU ou fallback silencioso;
- OOM, paginação severa, dtype/kernel não suportado, loss/gradiente não finito ou erro de optimizer;
- temperatura/throttling que comprometa o limite ou qualquer projeção/tempo decorrido acima de 60 min;
- caminho de saída já existente, tentativa de sobrescrita ou criação de artefato dentro do repositório;
- revisão, licença, privacidade, conteúdo sensível ou política de avaliação em desacordo com os gates.

Não há retry automático, redução silenciosa de parâmetros, troca para CPU/WSL2, compute remoto ou
alteração de modelo/dataset.

## Limitações e próximos gates

Este relatório cumpre a proposta de G5, mas não fecha a execução. Permanecem pendentes:

1. T049/T050: validação estática e então evidência autorizada de modelo, tokenizer, template, schema
   e device — sem inferir compatibilidade a partir do smoke sintético.
2. Revisão G6 do orchestrator sobre licença, privacidade, hashes, paths, no-overwrite e configuração;
   baseline e dry validation continuam fora do escopo desta entrega.
3. Autorização G7 explícita do owner para um run único e exato.
4. Após uma execução autorizada, comparação no `frozen-test` com accuracy, macro-F1, taxa de rótulo
   inválido, regressões e decisão final.

Até esses gates, não existem resultado de treinamento, métricas, logs de execução ou checkpoints a
reportar.
