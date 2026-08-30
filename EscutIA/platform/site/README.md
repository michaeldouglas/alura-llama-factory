# EscutIA — site institucional

Aplicação full-stack da EscutIA, construída com Next.js, TypeScript e Tailwind CSS.

O projeto contém a página institucional, autenticação Google, dashboard protegido
e persistência local de usuários, sessões e conversas em SQLite. O chat valida
sentimentos pela rota server-side em JavaScript. Por padrão, ela chama a API
FastAPI local em `platform/api-modelos`; com `USE_LOCAL_MODEL_API="false"`, usa
o modelo `mdba/escutia-lora` via Hugging Face. O billing usa os produtos já
criados na Stripe Sandbox/Test, resolvidos por lookup key.

## Executar localmente

Pré-requisito: Node.js 18.17 ou superior.

```bash
npm install
npm run db:generate
$env:DATABASE_URL = "file:./dev.db"
npm run db:push
npm run dev
```

Depois, abra [http://localhost:3000](http://localhost:3000).

## Validar e gerar produção

```bash
npm run lint
npm run build
npm run start
```

## Organização

- `app/page.tsx`: composição da página inicial.
- `app/globals.css`: tokens visuais, responsividade e animações leves.
- `components/site/`: componentes da página pública, navegação e apresentação institucional.
- `components/dashboard/`: sidebar, dados da conta e resumo comparativo do dashboard.
- `components/chat/`: interface protegida do chat, histórico e envio de texto.
- `components/shared/`: autenticação, saída da conta e ajuda imediata usados por mais de um contexto.
- `components/billing/`: tabela pública de preços e painel de assinatura/uso.
- `app/api/auth/[...nextauth]/route.ts`: rotas server-side de autenticação.
- `app/api/conversations/`: rotas protegidas para histórico e mensagens.
- `app/api/resources/`: recursos pessoais guardados pela própria pessoa.
- `app/api/sentiment/route.ts`: validação de sentimento pelo provedor configurado.
- `app/api/sentiment/records/`: check-ins manuais, histórico paginado, edição e exclusão de registros.
- `app/api/sentiment/export/route.ts`: exportação de registros em CSV ou JSON.
- `app/dashboard/page.tsx`: visão geral protegida, com filtros, resumo e gráficos.
- `app/dashboard/records/page.tsx`: check-in manual e histórico de registros.
- `app/dashboard/calendar/page.tsx`: calendário mensal e registros por dia.
- `app/dashboard/profile/page.tsx`: conta, exportação e gerenciamento de dados.
- `app/planos/page.tsx`: comparação detalhada dos cinco produtos EscutIA.
- `app/dashboard/billing/page.tsx`: plano atual, limite, adicionais e Customer Portal.
- `app/api/billing/`: Checkout, Customer Portal, status e webhook assinado.
- `lib/billing/`: catálogo por lookup key, entitlements, consumo e handlers de webhook.
- `prisma/schema.prisma`: schema local SQLite para usuários, sessões, conversas e billing.
- `public/logo.png`: logo oficial da EscutIA reutilizado no site.

## Ambiente

Copie `.env.example` para `.env.local` e preencha as credenciais do Google, o
`NEXTAUTH_SECRET` e mantenha `USE_LOCAL_MODEL_API="true"` para usar a API local
em `http://localhost:8000`. O `HF_TOKEN` só é necessário quando essa configuração
estiver como `false`; ele é usado somente no servidor e não deve usar prefixo
`NEXT_PUBLIC_`. Arquivos `.env.local` e `prisma/dev.db` são locais e estão
ignorados pelo Git. Para usar billing, configure `STRIPE_SECRET_KEY` com uma
chave restrita de Sandbox (`rk_test_...`), `STRIPE_WEBHOOK_SECRET` e mantenha
`ESCUTIA_HUMAN_CARE_ENABLED="false"` até o atendimento profissional estar
operacional. O `STRIPE_BILLING_PORTAL_CONFIGURATION` deve apontar para uma
configuração do Customer Portal que não ofereça o Cuidado Humano enquanto ele
estiver desabilitado.

O endpoint `/api/billing/webhook` espera o corpo bruto e a assinatura
`stripe-signature` da Stripe. No desenvolvimento, use Stripe CLI ou um endpoint
de teste configurado na conta Sandbox; não aponte chaves ou endpoints de
produção. O código rejeita chaves live e eventos com `livemode=true`.

Os cinco lookup keys usados pelo site são `escutia_free_monthly`,
`escutia_essential_monthly`, `escutia_premium_monthly`,
`escutia_human_care_monthly` e `escutia_ai_responses_100_onetime`.

O plano Grátis é criado localmente no evento de cadastro. Planos pagos usam
Checkout hospedado; o pacote adicional usa pagamento único. A confirmação e a
concessão de acesso acontecem somente por webhook idempotente. Os limites e
compras adicionais ficam no SQLite atual; não há migração para PostgreSQL,
Turso/libSQL ou configuração de persistência da Vercel nesta etapa.

Com o provedor local, a API FastAPI baixa o modelo na primeira inicialização,
reutiliza os pesos em cache e mantém o pipeline em memória. Para usar o caminho
anterior do Hugging Face, defina `USE_LOCAL_MODEL_API="false"` e configure o
`HF_TOKEN`.

## Posicionamento

A EscutIA é apresentada como uma plataforma de apoio emocional e bem-estar. O site deixa explícito que ela não substitui psicólogos, psiquiatras ou outros profissionais de saúde, não realiza diagnósticos e não oferece tratamento psicológico. O dashboard descreve apenas os registros feitos pela própria pessoa e não transforma a distribuição dos sentimentos em pontuação, causa, melhora, piora ou conclusão clínica.

## Origem dos registros

O schema atual mantém `sentiment`, `note` e `createdAt` em `SentimentRecord`, sem uma coluna de origem. Por isso, o check-in manual é salvo de forma transparente na interface, mas a distinção entre registro manual e registro criado pelo fluxo do agente não é persistida separadamente nesta etapa.

Check-ins e check-outs escolhidos durante conversas também usam esse registro
existente para alimentar o resumo, o histórico e o calendário. Conversas privadas
não criam conversa, mensagem, check-in ou check-out persistidos.
