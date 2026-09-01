<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles:
  - I. Spec Kit as the Source of Truth -> I. Fluxo do Spec Kit Antes da Implementação
  - II. Orchestration and Clear Role Boundaries -> II. Orquestração e Skills Especializadas
  - III. Dataset Integrity Before Training -> III. Responsabilidade e Integridade dos Dados
  - IV. Reproducible and Justified Experiments -> IV. Estratégia Orientada aos Recursos
  - V. Resource-Aware and Controlled Execution -> V. Experimentos Reproduzíveis e Registrados
- Added sections: None
- Removed sections: None
- Follow-up TODOs: None
-->
# Alura LLaMA-Factory Constitution

## Core Principles

### I. Fluxo do Spec Kit Antes da Implementação
Todo trabalho de implementação DEVE seguir o fluxo aplicável do Spec Kit. `spec.md` DEVE definir
os requisitos aprovados, `plan.md` DEVE registrar a abordagem técnica e `tasks.md` DEVE decompor o
trabalho executável. Os agentes DEVEM consultar esses artefatos antes de modificar código, dados ou
configurações de treinamento. Uma mudança de requisito DEVE ser registrada na especificação e
propagada ao plano e às tarefas antes de a implementação continuar. Esse fluxo mantém os requisitos
como fonte de verdade e torna cada decisão rastreável.

### II. Orquestração e Skills Especializadas
O `orchestrator` DEVE coordenar o processo completo de fine-tuning, definir a ordem das etapas,
delegar o trabalho especializado e autorizar a transição entre etapas. Cada agente DEVE identificar
e utilizar as skills especializadas aplicáveis ao seu escopo antes de executar o trabalho. A não
utilização de uma skill aplicável DEVE ser justificada no registro da tarefa. Cada delegação e
retorno DEVE declarar entradas, decisões, problemas encontrados e estado de prontidão. Essas regras
evitam atribuições conflitantes e preservam a responsabilidade por cada decisão.

### III. Responsabilidade e Integridade dos Dados
O `dataset-specialist` DEVE ser responsável por analisar, validar e preparar os dados. Todo dataset
DEVE ser validado antes do treinamento, e o treinamento NÃO DEVE começar sem um relatório que
declare o dataset preparado como apto. O dataset original DEVE permanecer imutável; limpeza,
normalização, filtragem e conversão DEVEM gerar artefatos derivados separados, com origem,
transformações e critérios documentados. Registros NÃO DEVEM ser removidos sem justificativa, nem
dados ausentes podem ser inventados. A qualidade e a rastreabilidade dos dados constituem um portão
obrigatório porque falhas nessa etapa comprometem todo resultado posterior.

### IV. Estratégia Orientada aos Recursos
O `training-engineer` DEVE ser responsável pela estratégia de fine-tuning, pelos hiperparâmetros,
pela configuração do LLaMA-Factory e pelo planejamento da execução. A estratégia DEVE considerar o
modelo base, o dataset validado e os recursos de hardware disponíveis. Antes do treinamento, o
responsável DEVE estimar memória e capacidade computacional, validar a configuração e justificar
mitigações como quantização, acumulação de gradientes ou checkpointing. O treinamento NÃO DEVE ser
iniciado sem validação dos dados, compatibilidade com o hardware e autorização explícita. Essa
avaliação evita execuções inviáveis e o desperdício de recursos.

### V. Experimentos Reproduzíveis e Registrados
Todo experimento DEVE ser reproduzível. O registro DEVE incluir modelo base e revisão, versão e
linhagem do dataset, método de fine-tuning, hiperparâmetros completos, arquivos de configuração,
seed, versões do LLaMA-Factory e das dependências, hardware utilizado, logs, métricas, checkpoints e
localização dos resultados. As escolhas de parâmetros DEVEM ser tecnicamente justificadas e ligadas
ao objetivo, aos dados e ao hardware. Configurações e resultados anteriores NÃO DEVEM ser
sobrescritos. O registro é suficiente somente quando permite a outra pessoa repetir o procedimento
ou explicar de forma objetiva qualquer diferença observada.

## Restrições Operacionais e Técnicas

- O LLaMA-Factory DEVE ser a interface canônica para os fluxos suportados de fine-tuning,
  avaliação, inferência e exportação. Uma ferramenta diferente exige justificativa documentada.
- Schemas de datasets e configurações de treinamento DEVEM ser validados contra as versões
  selecionadas do modelo e do LLaMA-Factory antes da execução.
- Dependências e versões de runtime DEVEM ser registradas em metadados versionados do projeto;
  premissas específicas do ambiente DEVEM acompanhar o experimento.
- Licenças, restrições de uso, privacidade e campos sensíveis de modelos e datasets DEVEM ser
  avaliados e registrados antes do uso.
- Segredos, credenciais, dados privados, pesos de modelos e checkpoints gerados NÃO DEVEM ser
  adicionados ao controle de versão. O local aprovado para esses artefatos DEVE ser documentado.

## Fluxo de Desenvolvimento e Portões de Qualidade

1. O `orchestrator` DEVE confirmar objetivo, modelo base, dataset, critérios de aceitação e
   artefatos aplicáveis do Spec Kit.
2. O `dataset-specialist` DEVE aplicar as skills pertinentes, validar a fonte, preparar um artefato
   derivado e reportar prontidão ou bloqueios.
3. Somente após a aprovação dos dados, o `training-engineer` DEVE aplicar as skills pertinentes e
   propor estratégia, hiperparâmetros, estimativa de recursos e configuração do LLaMA-Factory.
4. O `orchestrator` DEVE revisar consistência, licenças, riscos, custo esperado, proteções contra
   sobrescrita e conformidade com esta constituição.
5. O `training-engineer` DEVE validar ou executar um dry run da configuração quando suportado e
   iniciar somente a execução autorizada.
6. Configurações, logs, métricas, checkpoints e resultados DEVEM ser preservados, e o
   `orchestrator` DEVE compará-los com os critérios de aceitação.

Uma etapa NÃO DEVE avançar sem as evidências exigidas pela etapa anterior. Se uma decisão exigir
mudança de requisito, o fluxo DEVE retornar aos artefatos correspondentes do Spec Kit antes de o
trabalho prosseguir.

## Governance

Esta constituição prevalece sobre práticas e instruções conflitantes do projeto. Uma alteração DEVE
ser proposta em documento que descreva motivação, princípios afetados, impacto de compatibilidade e
eventual plano de migração ou transição. A alteração somente entra em vigor após aprovação do
responsável pelo projeto.

As versões da constituição DEVEM seguir versionamento semântico: MAJOR para mudanças incompatíveis,
remoção ou redefinição de princípios; MINOR para novos princípios, seções ou obrigações
materialmente ampliadas; PATCH para esclarecimentos e correções sem efeito normativo. A data da
última alteração DEVE ser atualizada a cada mudança, e a data original de ratificação DEVE
permanecer fixa.

Especificações, planos, tarefas, revisões e decisões de prontidão para treinamento DEVEM verificar
conformidade com a versão vigente. Uma exceção DEVE registrar escopo, justificativa, responsável,
aprovação e condição de expiração ou correção. Uma exceção não aprovada DEVE bloquear o trabalho
afetado.

**Version**: 1.1.0 | **Ratified**: 2026-08-21 | **Last Amended**: 2026-08-21
