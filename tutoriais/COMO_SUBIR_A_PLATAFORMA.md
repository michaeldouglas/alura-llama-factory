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
USE_LOCAL_MODEL_API="true"
LOCAL_MODEL_API_URL="http://localhost:8000"
HF_TOKEN="seu-token-do-hugging-face"
HF_MODEL_ID="mdba/escutia-lora"
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

Por padrão, o site usa a API local em `http://localhost:8000`. O `HF_TOKEN` só
é necessário se você definir `USE_LOCAL_MODEL_API="false"`, para voltar ao
provedor do Hugging Face. O token é usado somente pela API server-side.

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

## 7. Iniciar a API local do modelo

Esta API é um serviço separado do site. A integração do chat com ela será feita
em uma etapa posterior. Em outro terminal, a partir da raiz do projeto:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory
uv sync --native-tls
Copy-Item EscutIA\platform\api-modelos\.env.example EscutIA\platform\api-modelos\.env.local
uv run python -m uvicorn main:app `
  --app-dir EscutIA/platform/api-modelos `
  --host 0.0.0.0 `
  --port 8000
```

Na primeira inicialização, o modelo é baixado para `api-modelos/modelo/`.
Depois, os pesos locais são reutilizados e o pipeline permanece em memória
enquanto o serviço estiver ativo. Se o repositório do modelo for privado,
preencha `HF_TOKEN` somente no arquivo
`EscutIA/platform/api-modelos/.env.local`.

Teste em outro terminal:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod -Method Post -Uri http://localhost:8000/sentiment -ContentType "application/json" -Body '{"text":"Estou muito feliz hoje"}'
```

## 8. Validar

```powershell
npm run typecheck
npm run lint
npm run build
```

Não faça commit de `.env.local`, credenciais Google, token do Hugging Face ou
arquivos `prisma/*.db`.
