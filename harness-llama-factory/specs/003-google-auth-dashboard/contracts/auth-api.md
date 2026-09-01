# Contract: Authentication Routes

## OAuth entry point

- `GET /api/auth/signin`: endpoint gerenciado pelo NextAuth para iniciar o
  provedor configurado.
- O frontend inicia o fluxo pelo cliente de autenticação e não recebe o
  `GOOGLE_CLIENT_SECRET`.

## Session

- `GET /api/auth/session`: retorna a sessão sanitizada para componentes que
  precisarem dela.
- Dados sensíveis de tokens não são exibidos no frontend.

## Protected dashboard

- `GET /dashboard`: exige sessão válida.
- Sem sessão: redireciona para `/`.
- Com sessão: renderiza nome, imagem e e-mail com fallback seguro.

## Sign out

- O cliente encerra a sessão pelo mecanismo do NextAuth e retorna para `/`.
