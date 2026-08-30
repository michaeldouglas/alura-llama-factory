# Tasks: Billing EscutIA com Stripe e SQLite

## Phase 1 — Setup e catálogo

- [X] T001 [P] Confirmar cliente Stripe server-side sem dependência adicional em `EscutIA/platform/site/lib/stripe.ts`.
- [X] T002 [P] Documentar as variáveis Stripe e a flag do Cuidado Humano em `EscutIA/platform/site/.env.example`.
- [X] T003 Criar o catálogo tipado com lookup keys em `EscutIA/platform/site/lib/billing/catalog.ts`.
- [X] T004 Criar o cliente Stripe server-only em `EscutIA/platform/site/lib/stripe.ts`.

## Phase 2 — Fundação SQLite e billing

- [X] T005 Atualizar o schema Prisma SQLite com as entidades de billing em `EscutIA/platform/site/prisma/schema.prisma`.
- [X] T006 Criar helpers de perfil e sincronização em `EscutIA/platform/site/lib/billing/customer.ts`.
- [X] T007 Criar resolução de planos e status em `EscutIA/platform/site/lib/billing/entitlements.ts`.
- [X] T008 Criar controle de ciclos, reservas, consumo e expiração em `EscutIA/platform/site/lib/billing/usage.ts`.
- [X] T009 Criar handlers idempotentes de eventos Stripe em `EscutIA/platform/site/lib/billing/webhook-handlers.ts`.
- [X] T010 Atribuir o plano Grátis no evento de criação de usuário em `EscutIA/platform/site/lib/auth.ts`.

## Phase 3 — US1: Escolha e Checkout

- [X] T011 [US1] Criar `POST /api/billing/checkout` em `EscutIA/platform/site/app/api/billing/checkout/route.ts`.
- [X] T012 [US1] Criar a página pública de preços em `EscutIA/platform/site/app/planos/page.tsx` e componentes em `EscutIA/platform/site/components/billing/`.
- [X] T013 [US1] Criar `POST /api/billing/portal` em `EscutIA/platform/site/app/api/billing/portal/route.ts`.

## Phase 4 — US2 e US4: Webhooks e status

- [X] T014 [US2] Criar `POST /api/billing/webhook` em `EscutIA/platform/site/app/api/billing/webhook/route.ts`.
- [X] T015 [US2] Criar `GET /api/billing/status` em `EscutIA/platform/site/app/api/billing/status/route.ts`.
- [X] T016 [US4] Criar a tela de billing do dashboard em `EscutIA/platform/site/app/dashboard/billing/page.tsx`.
- [X] T017 [US4] Adicionar navegação para billing em `EscutIA/platform/site/components/dashboard/DashboardSidebar.tsx`.

## Phase 5 — US3: Consumo no chat e adicional

- [X] T018 [US3] Integrar reserva e confirmação de quota em `EscutIA/platform/site/app/api/agent/route.ts`.
- [X] T019 [US3] Enviar chave de operação estável pelo cliente em `EscutIA/platform/site/components/chat/ChatWorkspace.tsx`.
- [X] T020 [US3] Exibir o status de uso e a ação do adicional em `EscutIA/platform/site/components/billing/BillingPanel.tsx`.

## Phase 6 — US5: Organização estrutural

- [X] T021 [US5] Mover componentes públicos para `EscutIA/platform/site/components/site/` e atualizar imports.
- [X] T022 [US5] Mover componentes do dashboard para `EscutIA/platform/site/components/dashboard/` e atualizar imports.
- [X] T023 [US5] Mover componentes do chat para `EscutIA/platform/site/components/chat/` e atualizar imports.
- [X] T024 [US5] Mover componentes compartilhados para `EscutIA/platform/site/components/shared/` e atualizar imports.

## Phase 7 — Polish e validação

- [X] T025 Atualizar documentação de integração e Sandbox em `EscutIA/platform/site/README.md`.
- [X] T026 Executar `prisma generate`, `prisma db push`, typecheck, lint e build no site.
- [X] T027 Executar `graphify update .` no harness e revisar o status do repositório.

## Dependências

T001–T010 → T011–T017 → T018–T020 → T021–T024 → T025–T027.

## Estratégia

Entregar primeiro a fundação SQLite e catálogo, depois os fluxos de Checkout e
webhook, então o consumo real no chat e por fim a reorganização estrutural e a
validação completa.
