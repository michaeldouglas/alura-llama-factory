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

### User Story 4 - Distinguir a plataforma do fluxo de fine-tuning (Priority: P1)

Como responsável pelo produto, quero que o harness reconheça `EscutIA/platform/`
como o contexto separado do site e da API, para que solicitações de aplicação não
sejam confundidas com tarefas de dataset ou treinamento.

**Independent Test**: Uma solicitação sobre páginas, componentes, frontend,
backend, rotas ou API deve ser roteada para a plataforma; uma solicitação sobre
dataset, modelo ou LLaMA-Factory deve permanecer no contexto do harness. Arquivos
da plataforma não devem entrar na preflight de fine-tuning.

### Edge Cases

- O diretório informado é `EscutAI`, está ausente ou não tem o nome `EscutIA`.
- Um arquivo preparado, relatório obrigatório ou `dataset_info.json` está ausente.
- Um rótulo, output JSON, contagem, hash ou status de prontidão diverge do registro existente.
- O caminho de saída solicitado está no repositório ou dentro de `EscutIA`.
- O caminho de saída externo já existe.
- O manifesto do EscutIA declara autorização, mas não existe autorização correspondente no harness.
- O responsável solicita uma evolução do projeto estável sem definir o escopo, a preservação da versão anterior ou a validação pós-alteração.
- A solicitação menciona simultaneamente a plataforma e o fine-tuning sem separar os caminhos ou as validações.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O harness MUST resolver por padrão `../EscutIA` e MUST bloquear qualquer raiz cujo nome seja `EscutAI` ou diferente de `EscutIA`.
- **FR-002**: A integração MUST manter `EscutIA` em modo somente leitura por padrão, para proteger a versão estável atual, e MUST NOT executar seus scripts de preparação ou escrever dentro dele sem uma solicitação explícita de evolução do responsável.
- **FR-003**: A preflight MUST validar os arquivos JSON de treino, validação e avaliação, os seis campos/formatos declarados e os rótulos `negativo`, `neutro` e `positivo` dentro do JSON de saída.
- **FR-004**: A preflight MUST exigir `DATA_READY_FOR_SFT`, checks PASS, isolamento entre splits e avaliação congelada com hash correspondente.
- **FR-005**: A preflight MUST conferir os hashes das fontes contra o manifesto existente e a coerência da configuração LoRA com o perfil do harness.
- **FR-006**: O perfil MUST registrar modelo, revisão, dataset, template, estratégia e hiperparâmetros sem copiar pesos ou dados para o repositório.
- **FR-007**: A configuração renderizada MUST usar os artefatos preparados do EscutIA e MUST direcionar cache, logs, checkpoints e outputs para armazenamento externo aprovado.
- **FR-008**: A integração MUST NOT tratar a autorização registrada no manifesto do EscutIA como autorização de execução do harness; treinamento exige gate e autorização explícitos.
- **FR-009**: O harness MUST recusar sobrescrita de uma configuração renderizada existente e MUST recusar qualquer saída dentro do repositório ou do EscutIA.
- **FR-010**: O repositório MUST manter uma única política de ignorados de projeto no `.gitignore` da raiz; não deve existir outro `.gitignore` versionado dentro de `harness-llama-factory` ou `EscutIA`.
- **FR-011**: As configurações operacionais do `orchestrator`, `dataset-specialist` e `training-engineer` MUST declarar o projeto `EscutIA`, a política read-only, a ordem do Spec Kit, a delegação das skills aplicáveis e a exigência de autorização explícita; a documentação e os arquivos TOML carregados pelos agentes MUST permanecer coerentes.
- **FR-012**: Uma evolução explicitamente solicitada MUST ter escopo identificado, preservar a versão anterior, registrar mudanças no Spec Kit quando requisitos forem afetados, manter linhagem de datasets e executar validação pós-alteração; promoção de um derivado para a fonte exige autorização explícita e não pode ocorrer por inferência de um manifesto externo.
- **FR-013**: O harness MUST reconhecer `EscutIA/platform/` como contexto separado de aplicação, com `site/` para o frontend e `api/` para a API quando criada; arquivos desse contexto MUST NOT ser usados na preflight, como artefatos de treinamento ou como evidência de prontidão, e uma solicitação que envolva ambos os contextos MUST ter escopos e validações separados.

### Key Entities

- **Integration Profile**: contrato versionado de caminhos, identidades, schema e política de escrita.
- **EscutIA Read-only Project**: fonte externa existente com dados preparados, relatórios e configuração LoRA.
- **Preflight Result**: evidência de prontidão ou bloqueio sem conteúdo textual dos exemplos.
- **Rendered Proposal**: configuração resolvida do LLaMA-Factory armazenada somente no destino externo explícito.
- **EscutIA Platform Context**: aplicação separada, composta pelo site e pela API, fora do fluxo de fine-tuning.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A preflight padrão identifica o EscutIA correto e valida 100% dos 3.057 registros distribuídos nos três splits sem alterar nenhum arquivo do projeto externo.
- **SC-002**: A preflight bloqueia 100% dos caminhos com nome `EscutAI`, artefatos ausentes, hashes divergentes ou relatório que não seja `DATA_READY_FOR_SFT`.
- **SC-003**: 100% das configurações renderizadas apontam para os datasets existentes e para um destino externo, com zero gravação em `EscutIA/`.
- **SC-004**: Uma proposta existente nunca é sobrescrita e nenhuma execução de treinamento é iniciada pela preflight ou pelo renderizador.
- **SC-005**: Outra pessoa consegue reproduzir a preflight e identificar o modelo, revisão, splits, template, método, seed e política de saída apenas pelos artefatos versionados do harness.
- **SC-006**: O repositório possui exatamente um `.gitignore` de projeto versionado, localizado na raiz, e o `graphify-out` localizado no harness permanece ignorado.
- **SC-007**: Uma auditoria dos três arquivos TOML dos agentes encontra o contrato de integração do `EscutIA`, as skills responsáveis e a regra de não iniciar treinamento sem gates e autorização explícita, sem exigir alterações no projeto externo.
- **SC-008**: Sem solicitação explícita, nenhuma escrita é feita em `EscutIA`; com uma solicitação de evolução claramente delimitada, o harness identifica o escopo, preserva a versão anterior e exige validação antes de concluir a alteração.
- **SC-009**: Uma auditoria das instruções do harness identifica `EscutIA/platform/` como plataforma separada, mantém seus arquivos fora da preflight e distingue solicitações de site/API de solicitações de fine-tuning.

## Assumptions

- O projeto correto é a pasta existente `EscutIA/` no diretório pai do harness.
- A aplicação do produto fica em `EscutIA/platform/`, com site em `site/` e API em `api/` quando criada; ela não substitui nem altera a fonte estável de fine-tuning.
- Os arquivos preparados e relatórios atuais do EscutIA são a fonte de dados; o harness não os regenera.
- A execução de treinamento continua submetida à Constituição, aos gates e à autorização explícita do harness.
- O armazenamento externo aprovado usa `%LOCALAPPDATA%/alura-llama-factory/escutia-integration/`.
