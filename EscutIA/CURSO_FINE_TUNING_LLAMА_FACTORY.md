# Proposta de curso: Fine-Tuning de Modelos de IA com LLaMA-Factory

## Objetivo

Desenvolver uma visão prática do processo de especialização de modelos de linguagem,
partindo da escolha do modelo e da preparação dos dados até o treinamento, a avaliação e a
disponibilização do modelo resultante, utilizando técnicas eficientes de fine-tuning e o
LLaMA-Factory.

## Fundamentos e tomada de decisão

- Entender o papel do fine-tuning no ciclo de desenvolvimento de aplicações com LLMs.
- Diferenciar prompting, RAG e fine-tuning e identificar quando cada estratégia é adequada.
- Compreender a diferença entre fine-tuning completo e Parameter-Efficient Fine-Tuning (PEFT).
- Analisar requisitos de infraestrutura, memória e capacidade computacional.
- Selecionar um modelo-base considerando tamanho, licença, arquitetura, contexto e objetivo da aplicação.
- Estabelecer um baseline antes do treinamento para permitir comparação posterior.

## Preparação dos dados

- Compreender a influência da qualidade dos dados no comportamento do modelo.
- Selecionar e preparar datasets para Supervised Fine-Tuning (SFT).
- Trabalhar com formatos de instrução e conversação.
- Estruturar pares de instrução, contexto e resposta.
- Realizar limpeza, normalização e validação dos dados.
- Separar dados de treinamento, validação e avaliação.
- Identificar problemas como dados duplicados, inconsistentes ou de baixa qualidade.
- Preparar datasets personalizados para utilização no LLaMA-Factory.

## Fine-tuning eficiente com LoRA

- Compreender o funcionamento de adapters e PEFT.
- Entender os princípios da Low-Rank Adaptation (LoRA).
- Identificar quais parâmetros do modelo são modificados durante o treinamento.
- Configurar rank, alpha, dropout e módulos-alvo.
- Executar Supervised Fine-Tuning com LoRA utilizando o LLaMA-Factory.
- Acompanhar loss, checkpoints e comportamento do treinamento.
- Analisar o impacto dos principais hiperparâmetros.

## Fine-tuning com QLoRA e otimização de recursos

- Compreender a relação entre quantização e treinamento.
- Entender o funcionamento do QLoRA.
- Trabalhar com modelos quantizados em 4 bits.
- Comparar LoRA e QLoRA em consumo de memória, custo e desempenho.
- Configurar batch size, gradient accumulation, learning rate, epochs e demais parâmetros de treinamento.
- Identificar limitações de hardware e estratégias para executar treinamentos com recursos reduzidos.
- Analisar trade-offs entre custo computacional, tempo de treinamento e qualidade.

## Avaliação do modelo especializado

- Comparar o modelo-base com o modelo adaptado.
- Construir um conjunto de avaliação separado dos dados de treinamento.
- Realizar avaliação qualitativa e quantitativa.
- Avaliar aderência ao domínio e às instruções.
- Identificar overfitting e degradações de comportamento.
- Analisar erros e casos em que o fine-tuning não produziu o resultado esperado.
- Utilizar os resultados da avaliação para ajustar dados e hiperparâmetros.
- Repetir o ciclo de treinamento e avaliação de forma controlada.

## Gerenciamento e disponibilização do modelo

- Trabalhar com checkpoints e adapters gerados durante o treinamento.
- Carregar o modelo-base com o adapter treinado para inferência.
- Realizar merge de adapters quando necessário.
- Exportar o modelo especializado.
- Publicar e versionar artefatos no Hugging Face Hub.
- Documentar modelo-base, dataset, configuração de treinamento e resultados.
- Discutir requisitos para utilização posterior do modelo em aplicações e ambientes de produção.

## Sequência prática sugerida

1. Escolher o modelo-base e estabelecer um baseline.
2. Preparar, limpar, validar e separar o dataset.
3. Treinar e testar um adapter LoRA.
4. Avaliar o modelo-base e o modelo adaptado com um conjunto separado.
5. Analisar erros, overfitting e degradações; ajustar dados ou hiperparâmetros e repetir o ciclo.
6. Treinar com QLoRA e comparar memória, custo, tempo e qualidade.
7. Selecionar e versionar a melhor execução, incluindo checkpoints, configuração e resultados.
8. Publicar o adapter LoRA no Hugging Face Hub.
9. Fazer o merge e exportar um modelo completo quando isso for útil para distribuição ou produção.
10. Discutir integração com aplicações, APIs e requisitos de ambiente de produção.

## Artefatos esperados

- Dataset de treinamento, validação e avaliação, com versão identificada.
- Configurações YAML do LLaMA-Factory.
- Baseline e resultados de avaliação do modelo-base.
- Adapters LoRA/QLoRA e checkpoints selecionados.
- Relatório comparativo de qualidade, memória, custo e tempo.
- Modelo especializado exportado, quando necessário.
- Model card com modelo-base, licença, dataset, configuração, métricas, limitações e instruções de uso.
