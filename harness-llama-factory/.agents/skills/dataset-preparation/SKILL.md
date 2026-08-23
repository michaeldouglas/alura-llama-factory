---
name: dataset-preparation
description: Analisa, valida, limpa e prepara datasets para fine-tuning de modelos utilizando LLaMA-Factory.
user-invocable: true
---

# Dataset Preparation

## Objetivo

Padronizar o processo de análise e preparação de datasets utilizados em fine-tuning.

## Quando utilizar

Utilize esta skill quando a tarefa envolver:

- análise de datasets;
- validação de estrutura;
- limpeza de dados;
- identificação de duplicatas;
- identificação de registros inválidos;
- conversão de formato;
- preparação para LLaMA-Factory;
- divisão entre treino, validação e teste.

## Procedimento

1. Identifique o formato original.
2. Preserve o dataset original.
3. Analise a estrutura dos registros.
4. Identifique campos obrigatórios.
5. Procure registros inválidos.
6. Procure valores ausentes.
7. Identifique duplicatas.
8. Avalie inconsistências.
9. Valide o conteúdo textual.
10. Converta para o formato necessário quando aplicável.
11. Valide novamente o dataset resultante.
12. Gere um resumo da análise.

## Validações

Verifique quando aplicável:

- quantidade de registros;
- campos existentes;
- campos ausentes;
- valores nulos;
- duplicatas;
- registros vazios;
- encoding;
- tamanho das amostras;
- distribuição dos dados;
- consistência das instruções;
- consistência das respostas;
- estrutura das conversas;
- compatibilidade com o template do modelo.

## Segurança dos dados

- Nunca altere o dataset original diretamente.
- Trabalhe em uma cópia ou gere um novo arquivo.
- Não remova registros sem justificativa.
- Não invente conteúdo para completar dados ausentes.
- Registre transformações realizadas.

## Resultado esperado

Ao finalizar, informe:

- quantidade de registros analisados;
- problemas encontrados;
- transformações realizadas;
- formato final;
- localização do dataset preparado;
- se o dataset está pronto ou não para treinamento.
