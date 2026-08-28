# Feature Specification: Integração read-only do harness com EscutIA

**Feature Branch**: `feature/escutia-integration`  
**Created**: 2026-08-28  
**Status**: Approved for implementation in the harness only

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reconhecer o projeto correto (Priority: P1)

Como responsável pelo experimento, quero que o harness encontre o projeto existente `EscutIA` e rejeite o nome incorreto `EscutAI`, para que a execução nunca seja direcionada ao projeto errado.

**Independent Test**: Executar a preflight com o caminho padrão e com um diretório chamado `EscutAI`; o primeiro deve localizar `EscutIA` e o segundo deve ser bloqueado.

### User Story 2 - Verificar dados já preparados (Priority: P2)

Como responsável pelos dados, quero que o harness valide os artefatos preparados do EscutIA sem executar sua preparação nem alterar sua fonte, para que o dataset continue rastreável e imutável.

**Independent Test**: A preflight deve confirmar os três splits JSON, o schema, os rótulos JSON, os arquivos conversacionais, `DATA_READY_FOR_SFT`, isolamento entre splits, avaliação congelada e hashes das fontes, mantendo o alvo como read-only.

### User Story 3 - Preparar uma proposta segura de LLaMA-Factory (Priority: P3)

Como responsável pelo treinamento, quero renderizar uma proposta LoRA SFT com os caminhos do EscutIA e saídas externas, para que eu possa revisar recursos e gates antes de executar qualquer treinamento.

**Independent Test**: A proposta deve usar o dataset e a revisão do modelo registrados, direcionar logs e outputs para o armazenamento externo, impedir sobrescrita e não iniciar treinamento ao ser renderizada.

### Edge Cases

- O diretório informado é `EscutAI`, está ausente ou não tem o nome `EscutIA`.
- Um arquivo preparado, relatório obrigatório ou `dataset_info.json` está ausente.
- Um rótulo, output JSON, contagem, hash ou status de prontidão diverge do registro existente.
- O caminho de saída solicitado está no repositório ou dentro de `EscutIA`.
- O caminho de saída externo já existe.
- O manifesto do EscutIA declara autorização, mas não existe autorização correspondente no harness.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O harness MUST resolver por padrão `../EscutIA` e MUST bloquear qualquer raiz cujo nome seja `EscutAI` ou diferente de `EscutIA`.
- **FR-002**: A integração MUST manter `EscutIA` como alvo somente leitura e MUST NOT executar seus scripts de preparação ou escrever dentro dele.
- **FR-003**: A preflight MUST validar os arquivos JSON de treino, validação e avaliação, os seis campos/formatos declarados e os rótulos `negativo`, `neutro` e `positivo` dentro do JSON de saída.
- **FR-004**: A preflight MUST exigir `DATA_READY_FOR_SFT`, checks PASS, isolamento entre splits e avaliação congelada com hash correspondente.
- **FR-005**: A preflight MUST conferir os hashes das fontes contra o manifesto existente e a coerência da configuração LoRA com o perfil do harness.
- **FR-006**: O perfil MUST registrar modelo, revisão, dataset, template, estratégia e hiperparâmetros sem copiar pesos ou dados para o repositório.
- **FR-007**: A configuração renderizada MUST usar os artefatos preparados do EscutIA e MUST direcionar cache, logs, checkpoints e outputs para armazenamento externo aprovado.
- **FR-008**: A integração MUST NOT tratar a autorização registrada no manifesto do EscutIA como autorização de execução do harness; treinamento exige gate e autorização explícitos.
- **FR-009**: O harness MUST recusar sobrescrita de uma configuração renderizada existente e MUST recusar qualquer saída dentro do repositório ou do EscutIA.

### Key Entities

- **Integration Profile**: contrato versionado de caminhos, identidades, schema e política de escrita.
- **EscutIA Read-only Project**: fonte externa existente com dados preparados, relatórios e configuração LoRA.
- **Preflight Result**: evidência de prontidão ou bloqueio sem conteúdo textual dos exemplos.
- **Rendered Proposal**: configuração resolvida do LLaMA-Factory armazenada somente no destino externo explícito.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A preflight padrão identifica o EscutIA correto e valida 100% dos 3.057 registros distribuídos nos três splits sem alterar nenhum arquivo do projeto externo.
- **SC-002**: A preflight bloqueia 100% dos caminhos com nome `EscutAI`, artefatos ausentes, hashes divergentes ou relatório que não seja `DATA_READY_FOR_SFT`.
- **SC-003**: 100% das configurações renderizadas apontam para os datasets existentes e para um destino externo, com zero gravação em `EscutIA/`.
- **SC-004**: Uma proposta existente nunca é sobrescrita e nenhuma execução de treinamento é iniciada pela preflight ou pelo renderizador.
- **SC-005**: Outra pessoa consegue reproduzir a preflight e identificar o modelo, revisão, splits, template, método, seed e política de saída apenas pelos artefatos versionados do harness.

## Assumptions

- O projeto correto é a pasta existente `EscutIA/` no diretório pai do harness.
- Os arquivos preparados e relatórios atuais do EscutIA são a fonte de dados; o harness não os regenera.
- A execução de treinamento continua submetida à Constituição, aos gates e à autorização explícita do harness.
- O armazenamento externo aprovado usa `%LOCALAPPDATA%/alura-llama-factory/escutia-integration/`.
