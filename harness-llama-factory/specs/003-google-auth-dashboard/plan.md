# Implementation Plan: Google Auth e dashboard EscutIA

## Summary

Implementar autenticação Google, persistência local em SQLite e um dashboard
protegido dentro do projeto Next.js existente em `EscutIA/platform/site/`. A
feature não altera o harness, os artefatos estáveis de fine-tuning nem a futura
integração Stripe. A visão inicial do dashboard será analítica, com histórico de
sentimentos filtrável; os dados da conta ficam em `/dashboard/profile`.

## Technical Context

**Language/Version**: TypeScript, Next.js 14 App Router, Node.js runtime  
**Dependencies**: `next-auth` 4.x, `@next-auth/prisma-adapter`, Prisma 6.19.x, `@prisma/client` 6.19.x
**Storage**: SQLite local em `prisma/dev.db`, ignorado pelo Git  
**Authentication**: Google OAuth com sessão persistida pelo adaptador Prisma  
**Environment**: `.env.local` em desenvolvimento; somente placeholders em `.env.example`  
**Testing**: TypeScript check, `npm run lint` e `npm run build`; fluxo protegido validado localmente  
**Scope**: somente `EscutIA/platform/site/`, seus arquivos de dependência e o tutorial de operação  

## Constitution Check

- Spec Kit antes da implementação: PASS — esta feature tem spec, plan e tasks próprios.
- Separação de contextos: PASS — nenhum artefato do harness ou de fine-tuning será alterado.
- Segurança: PASS — segredos ficam em `.env.local` e não serão criados pelo agente.
- Persistência: PASS — SQLite local é explícito e não usa armazenamento do navegador como fonte de verdade.
- Escopo: PASS — Stripe e inferência ficam fora desta feature.

## Project Structure

```text
EscutIA/platform/site/
├── app/
│   ├── api/auth/[...nextauth]/route.ts
│   ├── chat/page.tsx
│   ├── dashboard/page.tsx
│   └── layout.tsx
├── components/
│   ├── AuthModal.tsx
│   ├── AccountAction.tsx
│   ├── AuthProvider.tsx
│   ├── ConversationAction.tsx
│   └── SignOutButton.tsx
├── lib/
│   ├── auth.ts
│   └── prisma.ts
├── prisma/schema.prisma
├── types/next-auth.d.ts
├── .env.example
└── package.json
```

The landing page remains the existing public experience. The account control
uses the client session to link authenticated users to `/dashboard`; the
conversation CTA links authenticated users to `/chat` and opens the OAuth modal
for visitors, preserving `/chat` as the callback destination. OAuth, sessions
and user persistence remain server-side.

## Data Flow

```text
Entrar → modal → Google OAuth → NextAuth route → Prisma/SQLite → /dashboard
Conversar agora (visitante) ────────────────────────────────→ modal → /chat
Conversar agora (autenticado) ───────────────────────────────→ /chat
```

The dashboard obtains the session server-side and never trusts profile data
sent by the browser. The Google client secret, session secret and database URL
are read only by server-side code.

## Security and Operations

- Do not create or read a real `.env.local` in source control.
- Provide `.env.example` with names only.
- Ignore `prisma/dev.db*` and local environment files.
- Use the Node.js runtime for the auth route and future model route.
- Use a persistent filesystem for SQLite; ephemeral serverless storage is not a
  supported deployment assumption.
