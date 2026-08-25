# Graph Report - alura-llama-factory  (2026-08-25)

## Corpus Check
- 30 files · ~328,529 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 78 nodes · 98 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a68edb41`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main
- validar_dataset.py
- MLflow — EscutIA
- limpar_resultados_preparacao.py
- Any
- Como reproduzir esta etapa
- EscutIA
- alura-llama-factory
- preparar_dataset.py
- sitecustomize.py
- Fine-tuning LoRA — EscutIA
- prepare_rows
- Como reproduzir esta etapa

## God Nodes (most connected - your core abstractions)
1. `Como reproduzir esta etapa` - 10 edges
2. `write_outputs()` - 9 edges
3. `Fine-tuning LoRA — EscutIA` - 9 edges
4. `main()` - 7 edges
5. `Dataset EscutIA — saída JSON` - 6 edges
6. `Como reproduzir esta etapa` - 6 edges
7. `MLflow — EscutIA` - 6 edges
8. `prepare_rows()` - 5 edges
9. `normalize()` - 4 edges
10. `write_json()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `normalize()` --references--> `Any`  [EXTRACTED]
  EscutIA/dataset/scripts/preparar_dataset.py →   _Bridges community 12 → community 4_
- `to_alpaca()` --references--> `Any`  [EXTRACTED]
  EscutIA/dataset/scripts/preparar_dataset.py →   _Bridges community 4 → community 9_
- `main()` --calls--> `prepare_rows()`  [EXTRACTED]
  EscutIA/dataset/scripts/preparar_dataset.py → EscutIA/dataset/scripts/preparar_dataset.py  _Bridges community 12 → community 0_
- `main()` --calls--> `split_stratified()`  [EXTRACTED]
  EscutIA/dataset/scripts/preparar_dataset.py → EscutIA/dataset/scripts/preparar_dataset.py  _Bridges community 4 → community 0_

## Import Cycles
- None detected.

## Communities (14 total, 2 thin omitted)

### Community 0 - "main"
Cohesion: 0.50
Nodes (4): ensure_output_is_empty(), ensure_sources(), main(), read_source()

### Community 1 - "validar_dataset.py"
Cohesion: 0.50
Nodes (4): carregar(), Path, Valida os artefatos preparados do dataset sem acessar outras pastas., validar()

### Community 2 - "MLflow — EscutIA"
Cohesion: 0.20
Nodes (8): 1. Preparar o ambiente, 2. Iniciar o MLflow, 3. Executar o treinamento, 4. Acompanhar uma execução, Erro sobre filesystem tracking backend, MLflow — EscutIA, Nenhuma execução aparece, Problemas comuns

### Community 3 - "limpar_resultados_preparacao.py"
Cohesion: 0.50
Nodes (4): assert_inside_root(), main(), Path, Remove apenas resultados gerados da preparação do dataset do EscutIA. As…

### Community 4 - "Any"
Cohesion: 0.43
Nodes (8): Any, Path, sha256_file(), split_stratified(), validate_split(), write_json(), write_jsonl(), write_outputs()

### Community 5 - "Como reproduzir esta etapa"
Cohesion: 0.17
Nodes (11): 1. Abrir a pasta do projeto, 2. Instalar os requirements do dataset, 3. Criar as pastas de trabalho, 4. Executar os notebooks, 5. Validar o resultado, Como reproduzir esta etapa, Dataset EscutIA — saída JSON, Fontes locais (+3 more)

### Community 6 - "EscutIA"
Cohesion: 0.50
Nodes (3): A EscutIA não é um psicólogo, EscutIA, Nossa missão

### Community 9 - "preparar_dataset.py"
Cohesion: 0.60
Nodes (4): json_response(), Prepara o dataset EscutIA com resposta JSON estruturada. Lê somente os arquivos…, to_alpaca(), to_conversational()

### Community 11 - "Fine-tuning LoRA — EscutIA"
Cohesion: 0.25
Nodes (8): Acompanhar o treinamento no MLflow, Detalhes: execução do notebook, Detalhes: MLflow, Fine-tuning LoRA — EscutIA, O que fizemos nesta etapa, Onde ficam os resultados, Papel do modelo na arquitetura, Se a máquina for diferente

### Community 12 - "prepare_rows"
Cohesion: 1.00
Nodes (3): comparison_key(), normalize(), prepare_rows()

### Community 13 - "Como reproduzir esta etapa"
Cohesion: 0.20
Nodes (10): 1. Abrir a pasta raiz do projeto, 2. Instalar os requirements do fine-tuning, 3. Confirmar o dataset preparado, 4. Confirmar a GPU, 5. Conferir a configuração, 6. Iniciar o MLflow, 7. Executar o notebook de treinamento, 8. Registrar e conferir os resultados (+2 more)

## Knowledge Gaps
- **34 isolated node(s):** `alura-llama-factory`, `Objetivo`, `1. Abrir a pasta do projeto`, `2. Instalar os requirements do dataset`, `3. Criar as pastas de trabalho` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fine-tuning LoRA — EscutIA` connect `Fine-tuning LoRA — EscutIA` to `MLflow — EscutIA`, `Como reproduzir esta etapa`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `Como reproduzir esta etapa` connect `Como reproduzir esta etapa` to `Fine-tuning LoRA — EscutIA`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `alura-llama-factory`, `Objetivo`, `1. Abrir a pasta do projeto` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._