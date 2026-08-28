# Quickstart: Google Auth e dashboard

1. Copie `.env.example` para `.env.local`.
2. Preencha as variáveis Google e o segredo da sessão sem commitá-las.
3. Gere o cliente Prisma e sincronize o SQLite:

   ```powershell
   npx prisma generate
   npx prisma db push
   ```

4. Inicie a aplicação:

   ```powershell
   npm run dev
   ```

5. Abra `http://localhost:3000`, clique em `Entrar`, conclua o Google OAuth e
   confirme o redirecionamento para `/dashboard`.
6. Confirme nome, foto e e-mail no dashboard, saia e verifique o bloqueio da
   rota sem sessão.
7. Verifique que `.env.local` e `prisma/dev.db` não aparecem no Git.
