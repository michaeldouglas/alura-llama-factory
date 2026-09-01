# Configurar o Google Auth

## 1. Criar as credenciais

1. Abra **APIs e serviços > Credenciais**.
2. Clique em **Criar credenciais > ID do cliente OAuth**.
3. Escolha **Aplicativo da Web**.
4. Em **Origens JavaScript autorizadas**, adicione:

   ```text
   http://localhost:3000
   ```

5. Em **URIs de redirecionamento autorizados**, adicione:

   ```text
   http://localhost:3000/api/auth/callback/google
   ```

6. Copie o Client ID e o Client Secret.

## 2. Configurar a plataforma

Na pasta `EscutIA/platform/site`, crie `.env.local` a partir de `.env.example` e preencha:

```env
GOOGLE_CLIENT_ID="cole-o-client-id-aqui"
GOOGLE_CLIENT_SECRET="cole-o-client-secret-aqui"
NEXTAUTH_SECRET="gere-um-segredo-aleatorio"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="file:./dev.db"
```

Para gerar o `NEXTAUTH_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Iniciar

```powershell
npm run db:generate
$env:DATABASE_URL = "file:./dev.db"
npm run db:push
Remove-Item Env:DATABASE_URL
npm run dev
```

Abra `http://localhost:3000`, clique em **Entrar** e escolha **Continuar com Google**.

Nunca envie `.env.local`, o Client Secret ou arquivos `prisma/*.db` para o GitHub.
