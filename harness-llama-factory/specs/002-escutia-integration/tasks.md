# Tasks: Integração read-only do harness com EscutIA

## Phase 1: Setup

- [X] T001 Criar o perfil versionado da integração em `integrations/escutia/escutia-integration.json`.
- [X] T002 [P] Criar a documentação operacional em `integrations/escutia/README.md`.

## Phase 2: Foundational

- [X] T003 Definir no perfil a política de alvo somente leitura, identidades do modelo/dataset e raiz externa de outputs em `integrations/escutia/escutia-integration.json`.
- [X] T004 [P] Alinhar as responsabilidades do orchestrator, dataset-specialist e training-engineer nos arquivos `.codex/agents/*.md`.

## Phase 3: User Story 1 — Resolver o projeto correto

- [X] T005 [US1] Implementar resolução segura de `../EscutIA` e rejeição explícita de `EscutAI` em `integrations/escutia/scripts/validate_escutia_integration.py`.
- [X] T006 [US1] Cobrir resolução padrão e rejeição de nomenclatura em `integrations/escutia/tests/test_escutia_integration.py`.

## Phase 4: User Story 2 — Validar os dados existentes

- [X] T007 [US2] Implementar validação read-only dos splits, outputs JSON, arquivos conversacionais, dataset_info, reports, hashes e configuração LoRA em `integrations/escutia/scripts/validate_escutia_integration.py`.
- [X] T008 [US2] Testar prontidão, contagens, política de não escrita e resultados bloqueados em `integrations/escutia/tests/test_escutia_integration.py`.

## Phase 5: User Story 3 — Renderizar proposta segura

- [X] T009 [US3] Implementar renderização da configuração LoRA SFT com dataset do EscutIA e outputs externos em `integrations/escutia/scripts/render_escutia_config.py`.
- [X] T010 [US3] Impedir destinos internos, sobrescrita e autorização implícita no renderizador em `integrations/escutia/scripts/render_escutia_config.py`.
- [X] T011 [US3] Testar paths do dataset, destino externo e ausência de execução em `integrations/escutia/tests/test_escutia_integration.py`.

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T012 Executar a suíte de testes e a preflight read-only da integração.
- [X] T013 Atualizar o grafo do harness com `graphify update .`, validar que ele contém a integração e manter somente `harness-llama-factory/graphify-out`.
- [X] T014 Registrar no quickstart/documentação que EscutIA não é alterado e que treinamento continua dependente dos gates.
- [X] T015 Consolidar regras do `.gitignore` na raiz, remover os `.gitignore` redundantes de `harness-llama-factory/`, `harness-llama-factory/.specify/` e `EscutIA/fine_tuning_qlora/`, e validar o `graphify-out` local com `git check-ignore`.

## Dependencies & Execution Order

`T001–T004 → T005–T008 → T009–T011 → T012 → T013–T014`

T002, T004, T006 e T011 são paralelizáveis quando não alteram os mesmos arquivos. T007 depende de T005; T009 depende do perfil e da preflight.

## Implementation Strategy

1. MVP: perfil, resolução segura e preflight read-only.
2. Incremento: renderizador externo e testes.
3. Fechamento: validação, Graphify único e documentação de handoff.
