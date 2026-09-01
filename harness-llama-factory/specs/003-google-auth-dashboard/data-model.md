# Data Model: Google Auth e dashboard

## User

| Campo | Tipo | Regra |
|---|---|---|
| `id` | string | Identificador local obrigatório |
| `name` | string opcional | Nome retornado pelo Google |
| `email` | string opcional/único | E-mail do provedor |
| `emailVerified` | datetime opcional | Data de verificação do provedor |
| `image` | string opcional | URL da foto do perfil |
| `accounts` | relação | Contas OAuth vinculadas |
| `sessions` | relação | Sessões persistidas |

## Account

Representa a conta Google vinculada ao usuário, incluindo `provider` e
`providerAccountId` únicos, tokens OAuth quando fornecidos pelo adaptador e a
relação com `User`.

## Session

Representa uma sessão persistida, com token único, usuário relacionado, data de
expiração e relação reversa para `User`.

## VerificationToken

Entidade padrão do adaptador para fluxos de verificação e compatibilidade com o
modelo de autenticação. Não contém credenciais Google em texto exposto na UI.
