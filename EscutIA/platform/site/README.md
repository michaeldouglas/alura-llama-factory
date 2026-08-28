# EscutIA — site institucional

Aplicação full-stack da EscutIA, construída com Next.js, TypeScript e Tailwind CSS.

O projeto contém a página institucional, autenticação Google, dashboard protegido
e persistência local de usuários, sessões e conversas em SQLite. O chat valida
sentimentos pela rota server-side em JavaScript usando o modelo `mdba/escutia-lora`
via Hugging Face. O Stripe permanece fora desta etapa.

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
- `components/ChatWorkspace.tsx`: interface protegida do chat, histórico e envio de texto.
- `app/api/auth/[...nextauth]/route.ts`: rotas server-side de autenticação.
- `app/api/conversations/`: rotas protegidas para histórico e mensagens.
- `app/api/sentiment/route.ts`: validação de sentimento pelo modelo Hugging Face.
- `app/dashboard/page.tsx`: área protegida do usuário.
- `prisma/schema.prisma`: schema local SQLite para usuários, sessões e conversas.
- `public/logo.png`: logo oficial da EscutIA reutilizado no site.

## Ambiente

Copie `.env.example` para `.env.local` e preencha as credenciais do Google, o
`NEXTAUTH_SECRET` e um `HF_TOKEN` com permissão de Inference Providers. O token
é usado somente no servidor; não use prefixo `NEXT_PUBLIC_`. Arquivos `.env.local`
e `prisma/dev.db` são locais e estão ignorados pelo Git.

O modelo publicado em `mdba/escutia-lora` é usado pela API server-side através do
Hugging Face Inference Providers. A primeira validação pode demorar mais enquanto
o provedor aquece o modelo; as requisições seguintes reutilizam o modelo aquecido
no provedor e a aplicação não baixa os pesos a cada mensagem.

## Posicionamento

A EscutIA é apresentada como uma plataforma de apoio emocional e bem-estar. O site deixa explícito que ela não substitui psicólogos, psiquiatras ou outros profissionais de saúde, não realiza diagnósticos e não oferece tratamento psicológico.
