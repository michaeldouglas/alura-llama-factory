# Graph Report - alura-llama-factory  (2026-08-25)

## Corpus Check
- 30 files · ~328,359 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 69 nodes · 89 edges · 13 communities (11 shown, 2 thin omitted)
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
- Dataset EscutIA — saída JSON
- EscutIA
- alura-llama-factory
- preparar_dataset.py
- sitecustomize.py
- Fine-tuning LoRA — EscutIA
- prepare_rows

## God Nodes (most connected - your core abstractions)
1. `Fine-tuning LoRA — EscutIA` - 12 edges
2. `write_outputs()` - 9 edges
3. `Dataset EscutIA — saída JSON` - 8 edges
4. `main()` - 7 edges
5. `MLflow — EscutIA` - 6 edges
6. `prepare_rows()` - 5 edges
7. `normalize()` - 4 edges
8. `write_json()` - 4 edges
9. `write_jsonl()` - 4 edges
10. `to_alpaca()` - 4 edges

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

## Communities (13 total, 2 thin omitted)

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

### Community 5 - "Dataset EscutIA — saída JSON"
Cohesion: 0.22
Nodes (8): Dataset EscutIA — saída JSON, Executar tudo pelo Jupyter, Fontes locais, O que fizemos nesta etapa, Objetivo, Preparar o ambiente, Reprodução por script, Saídas

### Community 6 - "EscutIA"
Cohesion: 0.50
Nodes (3): A EscutIA não é um psicólogo, EscutIA, Nossa missão

### Community 9 - "preparar_dataset.py"
Cohesion: 0.60
Nodes (4): json_response(), Prepara o dataset EscutIA com resposta JSON estruturada. Lê somente os arquivos…, to_alpaca(), to_conversational()

### Community 11 - "Fine-tuning LoRA — EscutIA"
Cohesion: 0.17
Nodes (12): 1. Preparar o ambiente, 2. Confirmar a GPU, 3. Conferir o dataset, 4. Iniciar o MLflow, 5. Executar o notebook de treinamento, 6. Acompanhar o treinamento no MLflow, 7. Onde ficam os resultados, Fine-tuning LoRA — EscutIA (+4 more)

### Community 12 - "prepare_rows"
Cohesion: 1.00
Nodes (3): comparison_key(), normalize(), prepare_rows()

## Knowledge Gaps
- **27 isolated node(s):** `alura-llama-factory`, `Objetivo`, `O que fizemos nesta etapa`, `Fontes locais`, `Preparar o ambiente` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fine-tuning LoRA — EscutIA` connect `Fine-tuning LoRA — EscutIA` to `MLflow — EscutIA`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `alura-llama-factory`, `Objetivo`, `O que fizemos nesta etapa` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._