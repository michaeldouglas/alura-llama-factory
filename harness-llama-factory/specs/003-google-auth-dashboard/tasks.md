# Tasks: Google Auth e dashboard EscutIA

## Phase 1: Setup

- [X] T001 Adicionar `next-auth`, `@next-auth/prisma-adapter`, `@prisma/client` e `prisma` às dependências de `EscutIA/platform/site/package.json`.
- [X] T002 [P] Registrar os nomes das variáveis server-side em `EscutIA/platform/site/.env.example` sem valores reais.
- [X] T003 [P] Configurar a ignorância de `.env.local` e `prisma/dev.db*` em `EscutIA/platform/site/.gitignore`.

## Phase 2: Foundational

- [X] T004 Criar o schema SQLite do adaptador NextAuth em `EscutIA/platform/site/prisma/schema.prisma`.
- [X] T005 Criar o cliente Prisma singleton em `EscutIA/platform/site/lib/prisma.ts`.
- [X] T006 Criar opções server-side do Google OAuth e Prisma Adapter em `EscutIA/platform/site/lib/auth.ts`.
- [X] T007 Criar a extensão de tipos da sessão em `EscutIA/platform/site/types/next-auth.d.ts`.
- [X] T008 Criar a rota de autenticação em `EscutIA/platform/site/app/api/auth/[...nextauth]/route.ts`.

## Phase 3: User Story 1 — Entrar com Google

- [X] T009 [US1] Criar o provider de sessão do cliente em `EscutIA/platform/site/components/AuthProvider.tsx`.
- [X] T010 [US1] Criar o modal de login Google em `EscutIA/platform/site/components/AuthModal.tsx`.
- [X] T011 [US1] Integrar o botão `Entrar` do header ao modal em `EscutIA/platform/site/components/Header.tsx`.

## Phase 4: User Story 2 — Persistir o usuário localmente

- [X] T012 [US2] Sincronizar o schema com o SQLite local e gerar o cliente Prisma sem criar credenciais no repositório.
- [X] T013 [US2] Verificar que usuários, contas OAuth e sessões são persistidos pelo Prisma Adapter após o callback Google.

## Phase 5: User Story 3 — Área protegida e dashboard

- [X] T014 [US3] Criar a página protegida em `EscutIA/platform/site/app/dashboard/page.tsx` usando sessão server-side.
- [X] T015 [US3] Criar o controle de saída em `EscutIA/platform/site/components/SignOutButton.tsx`.
- [X] T016 [US3] Redirecionar usuários sem sessão para `/` e usuários autenticados para `/dashboard`.
- [X] T017 [US3] Exibir nome, foto, e-mail e fallbacks acessíveis no dashboard.

## Phase 6: Tutorial e validação

- [X] T018 Criar o passo a passo de configuração em `tutoriais/COMO_SUBIR_A_PLATAFORMA.md`.
- [X] T019 Atualizar `EscutIA/platform/site/README.md` com autenticação, SQLite e segurança das variáveis.
- [X] T020 Executar geração Prisma, typecheck, lint e build do site.
- [X] T021 Verificar que nenhum `.env.local`, segredo Google ou banco SQLite é rastreado pelo Git.
- [X] T022 Atualizar o grafo do harness após a alteração documental e registrar que Stripe permanece fora do escopo.

## Phase 7: Navegação orientada pela sessão

- [X] T023 Registrar no Spec Kit a navegação autenticada para dashboard e para o futuro chat.
- [X] T024 Tornar o controle de conta do header dependente da sessão, apontando usuários autenticados para `/dashboard`.
- [X] T025 Fazer “Conversar agora” abrir o login para visitantes e levar usuários autenticados para `/chat`.
- [X] T026 Criar a rota protegida `/chat` como tela de preparação para a futura conversa.
- [X] T027 Validar os estados autenticado, não autenticado e carregando, além de typecheck, lint e build.

## Phase 8: Revisão de qualidade do site

- [X] T028 Aplicar `frontend-design` para preservar a direção visual e corrigir tipografia, responsividade e estados de interação.
- [X] T029 Aplicar `vercel-composition-patterns` para manter CTAs de conta e conversa em componentes reutilizáveis.
- [X] T030 Aplicar `vercel-react-best-practices` para revisar limites client/server, navegação e carregamento dos componentes.
- [X] T031 Aplicar `web-design-guidelines` para corrigir skip link, foco visível, foco do modal, rolagem, semântica e conteúdo acessível.
- [X] T032 Reexecutar as validações do site e atualizar o Graphify após a revisão.

## Phase 9: Visão analítica de sentimentos

- [X] T033 Criar a consulta server-side de registros agregados por dia em `EscutIA/platform/site/lib/sentiment-dashboard.ts`.
- [X] T034 Criar a rota autenticada `EscutIA/platform/site/app/api/sentiment/summary/route.ts` com filtros de período e sentimento.
- [X] T035 Criar o menu lateral reutilizável e tornar `/dashboard` a visão geral analítica.
- [X] T036 Criar gráfico de barras, cartões de resumo, filtros e estados vazio/atualização em `EscutIA/platform/site/components/SentimentDashboard.tsx`.
- [X] T037 Mover a visão de conta para `/dashboard/profile` e integrar os links de navegação.
- [X] T038 Validar typecheck, lint, build, acessibilidade básica, URL dos filtros e atualizar o Graphify.

## Dependencies & Execution Order

`T001–T008 → T009–T011 → T012–T013 → T014–T017 → T018–T022 → T023–T027 → T028–T032 → T033–T038`

## Implementation Strategy

1. Configurar dependências, ambiente e schema.
2. Implementar o callback Google e a persistência SQLite.
3. Implementar modal, redirect e dashboard protegido.
4. Implementar navegação dependente da sessão e o destino protegido do futuro chat.
5. Documentar configuração segura e validar o build completo.
6. Implementar a visão analítica protegida, mantendo o perfil em rota própria e
   consultando apenas os registros do usuário autenticado.
