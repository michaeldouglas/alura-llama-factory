# Como subir a plataforma

## 1. Entrar na pasta

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory\EscutIA\platform\site
```

## 2. Instalar dependências

```powershell
npm install
```

## 3. Criar o ambiente local

```powershell
Copy-Item .env.example .env.local
```

Preencha `.env.local`:

```env
GOOGLE_CLIENT_ID="seu-client-id"
GOOGLE_CLIENT_SECRET="seu-client-secret"
NEXTAUTH_SECRET="um-segredo-aleatorio"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="file:./dev.db"
```

Gere um segredo com:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Configurar o Google

No Google Cloud Console:

1. Crie ou selecione um projeto.
2. Configure a tela de consentimento OAuth.
3. Crie uma credencial OAuth para aplicação Web.
4. Adicione como origem autorizada: `http://localhost:3000`.
5. Adicione como redirecionamento autorizado:
   `http://localhost:3000/api/auth/callback/google`.
6. Copie o Client ID e o Client Secret para `.env.local`.

## 5. Criar o SQLite

```powershell
npm run db:generate
$env:DATABASE_URL = "file:./dev.db"
npm run db:push
Remove-Item Env:DATABASE_URL
```

O arquivo `prisma/dev.db` é local e não deve ser enviado ao GitHub.

## 6. Iniciar

```powershell
npm run dev
```

Abra `http://localhost:3000`, clique em **Entrar**, escolha **Continuar com
Google** e confirme o redirecionamento para `/dashboard`.

## 7. Validar

```powershell
npm run typecheck
npm run lint
npm run build
```

Não faça commit de `.env.local`, credenciais Google ou arquivos `prisma/*.db`.
