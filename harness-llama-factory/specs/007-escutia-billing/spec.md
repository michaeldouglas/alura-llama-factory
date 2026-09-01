# Feature Specification: Billing e organização da plataforma EscutIA

**Feature Branch**: `feature/escutia-billing`
**Status**: Em implementação em `EscutIA/platform/site`

## Objetivo

Permitir que pessoas autenticadas conheçam os planos da EscutIA, assinem planos
pagos, gerenciem sua assinatura e consumam respostas da IA dentro do limite do
plano, com os pagamentos processados pela Stripe em Sandbox/Test mode durante
esta etapa.

## Requisitos funcionais

- O site MUST use the five existing Stripe prices through lookup keys, without
  hardcoding price IDs in application code.
- O cadastro MUST atribuir o plano Grátis localmente, sem Checkout e sem criar
  Customer, Subscription ou cobrança na Stripe.
- O site MUST offer paid monthly plans through Stripe-hosted Checkout and a
  one-time add-on for 100 responses, without trials, annual prices or coupons.
- A página pública `/planos` MUST show all plans, prices, periodicity, response
  limits, human-session information and commercial restrictions in accessible
  responsive content.
- The Human Care plan MUST remain unavailable while
  `ESCUTIA_HUMAN_CARE_ENABLED` is false, with the restriction enforced on the
  server and communicated in the interface.
- The application MUST persist billing identity, subscription state, price
  lookup key, plan and status in the existing Prisma SQLite database.
- AI response usage MUST be controlled per user and period, consume base quota
  before add-on quota, and prevent use after the period expires.
- Add-on credits MUST be granted only after a confirmed successful one-time
  payment, expire at the current subscription cycle end, and never create a
  subscription.
- Stripe webhooks MUST verify signatures, process events idempotently and sync
  subscription, payment failure, cancellation and refund state.
- The Customer Portal MUST be available to users with a Stripe customer and
  return them to the EscutIA billing area.
- No emotional content, diagnosis, treatment claim or sensitive conversation
  data MAY be written to Stripe metadata.
- The current Prisma SQLite provider MUST remain unchanged. PostgreSQL and
  Turso/libSQL are outside this feature.

## User scenarios and acceptance criteria

### US1 — Escolher e iniciar um plano (P1)

1. A visitor opens `/planos` and sees the five catalog entries with clear
   monthly or one-time billing labels.
2. An authenticated user selects Essencial or Premium and is redirected to
   hosted Checkout using the matching lookup key.
3. A logged-out visitor is asked to authenticate before initiating Checkout.
4. Human Care is visibly unavailable and the API rejects direct attempts while
   the feature flag is disabled.

### US2 — Assinatura e acesso (P1)

1. A confirmed Checkout webhook creates or updates the local billing profile and
   subscription.
2. A new account has a local Grátis profile without Stripe customer creation.
3. The billing dashboard shows the current plan, status and period.

### US3 — Limite mensal e pacote adicional (P1)

1. Each AI response reserves one unit before model execution and finalizes it
   only after the assistant response is persisted.
2. A user without available units receives a clear limit message and the model
   is not invoked.
3. A confirmed add-on payment adds 100 units to the active period for eligible
   paid plans only.
4. Unused add-on units cannot be used after the period end or on the Grátis
   plan.

### US4 — Gerenciar ciclo e pagamentos (P2)

1. The user can open Customer Portal from the billing dashboard.
2. Subscription updates, renewals, cancellations and payment failures sync to
   SQLite through signed webhooks.
3. A refund revokes unused add-on units without creating a negative balance.

### US5 — Organização dos componentes (P2)

1. Public site components live under `components/site`.
2. Dashboard components live under `components/dashboard`.
3. Chat components live under `components/chat`.
4. Components used by multiple contexts live under `components/shared`.
5. Imports remain explicit and behavior remains unchanged after the move.

## Entidades

- BillingProfile
- BillingSubscription
- AiUsagePeriod
- AiUsageEntry
- AddonPurchase
- StripeEvent

## Critérios de sucesso

- All five catalog lookup keys resolve to active Sandbox prices at runtime.
- A free signup creates no Stripe object and has a usable local free quota.
- Duplicate delivery of the same webhook does not duplicate subscription or
  add-on fulfillment.
- A user cannot generate a successful response after consuming the available
  base and add-on quota.
- A completed local SQLite typecheck, Prisma schema validation, lint and build
  pass without changing the provider.
- The public pricing page is usable on mobile and with keyboard navigation.

## Assumptions and boundaries

- Stripe secret and webhook credentials are configured by the deploy/runtime
  environment; no real secrets are committed.
- The Stripe account remains in Sandbox/Test mode for this implementation.
- Vercel persistence is not solved by this feature.
- Human Care professional scheduling and session fulfillment are not implemented
  here; only the server-side availability gate is prepared.
