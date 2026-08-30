# Implementation Plan: Billing EscutIA com Stripe e SQLite

## Escopo

Implementar a integração de billing dentro de `EscutIA/platform/site`, sem
alterar o harness de fine-tuning. O Prisma continuará usando o provider SQLite
existente e a implementação será validada localmente.

## Arquitetura

- `lib/stripe.ts` fornece um cliente Stripe server-only e falha de forma clara
  quando a chave de teste não está configurada.
- O cliente Stripe usa `fetch` nativo do runtime Node para evitar adicionar uma
  dependência enquanto o registry local apresenta falha de certificado; os
  endpoints e a verificação HMAC continuam server-side.
- `lib/billing/catalog.ts` mantém lookup keys, limites, elegibilidade e textos
  do catálogo; IDs retornados pela Stripe são resolvidos em runtime.
- Route handlers autenticados criam Checkout Sessions e Customer Portal.
- `app/api/billing/webhook/route.ts` valida o corpo bruto e a assinatura antes
  de delegar eventos para `lib/billing/webhook-handlers.ts`.
- SQLite mantém perfil atual, histórico de assinaturas, períodos de uso,
  lançamentos de consumo, compras avulsas e eventos Stripe processados.
- O agente reserva uma resposta antes da inferência e confirma ou libera a
  reserva conforme o resultado do streaming.

## Rotas

- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `GET /api/billing/status`
- `POST /api/billing/webhook`
- `GET /planos`
- `GET /dashboard/billing`

## Decisões de billing

- Planos pagos usam Checkout `mode=subscription`.
- O adicional usa Checkout `mode=payment`, nunca assinatura.
- O plano Grátis é atribuído somente localmente.
- A quota base é consumida antes da quota adicional.
- O ciclo pago usa `current_period_start` e `current_period_end` da Stripe.
- O ciclo Grátis usa o mês-calendário em `America/Sao_Paulo`.
- Cancelamento no fim do período preserva acesso até a data final.
- `past_due` impede novas compras avulsas, e a sincronização de pagamento
  devolve o acesso quando a fatura é paga.
- O Cuidado Humano permanece bloqueado por padrão com
  `ESCUTIA_HUMAN_CARE_ENABLED=false`.

## Organização de componentes

`components/site`, `components/dashboard`, `components/chat` e `components/shared`
serão usados para deixar o domínio explícito. Componentes de billing ficarão
em `components/billing` porque a tabela de preços é pública e o status/ações
também aparecem no dashboard.

## Fora do escopo

- Migração para PostgreSQL.
- Alteração do provider Prisma.
- Turso/libSQL.
- Configuração de produção na Stripe.
- Sessões humanas, agendamento ou repasses profissionais.
- Clientes, assinaturas, Checkout Sessions, pagamentos ou cobranças reais
  criados durante a implementação.
