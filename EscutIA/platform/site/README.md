# EscutIA — site institucional

Aplicação full-stack da EscutIA, construída com Next.js, TypeScript e Tailwind CSS.

O projeto contém a página institucional, autenticação Google, dashboard protegido
e persistência local de usuários e sessões em SQLite. A inferência do modelo e o
Stripe permanecem fora desta etapa.

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
- `components/`: Header, Hero, ChatPreview, HowItWorks, Features, Safety, About, CTA e Footer.
- `components/AuthModal.tsx`: modal de entrada com Google OAuth.
- `app/api/auth/[...nextauth]/route.ts`: rotas server-side de autenticação.
- `app/dashboard/page.tsx`: área protegida do usuário.
- `prisma/schema.prisma`: schema local SQLite para usuários e sessões.
- `public/logo.png`: logo oficial da EscutIA reutilizado no site.

## Ambiente

Copie `.env.example` para `.env.local` e preencha as credenciais do Google e o
`NEXTAUTH_SECRET`. Arquivos `.env.local` e `prisma/dev.db` são locais e estão
ignorados pelo Git.

## Posicionamento

A EscutIA é apresentada como uma plataforma de apoio emocional e bem-estar. O site deixa explícito que ela não substitui psicólogos, psiquiatras ou outros profissionais de saúde, não realiza diagnósticos e não oferece tratamento psicológico.
