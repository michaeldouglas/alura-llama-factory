# Configurações

Como nosso projeto utiliza o MCP da Stripe, será necessário criar uma chave restrita no ambiente de teste da Stripe e disponibilizá-la ao Codex por meio de uma variável de ambiente.

> **Importante:** faça toda a configuração inicial em **Sandbox/Test mode**. Assim, os produtos, preços, clientes e assinaturas criados não afetarão dados reais nem movimentarão dinheiro.

## 1. Acesse as chaves da Stripe

Entre em:

[Stripe Dashboard — API keys](https://dashboard.stripe.com/test/apikeys)

Confirme que o Dashboard está no ambiente **Sandbox/Test mode**.

Na seção **Restricted keys** ou **Chaves restritas**, clique em **Create restricted key**.

Não utilize a chave publicável `pk_test_...`, pois ela não permite criar produtos, preços ou assinaturas. Evite também a chave secreta completa `sk_test_...`, porque ela concede mais acesso do que o necessário.

## 2. Preencha os dados

Use, por exemplo:

- **Key name:** Codex Stripe MCP
- **Environment:** Sandbox/Test mode
- **Purpose/Description:** Acesso do Codex à Stripe pelo MCP

A chave criada para esse ambiente deverá começar com:

```text
rk_test_
```

## 3. Configure as permissões

Para permitir que o Codex crie os planos e, posteriormente, implemente assinaturas no projeto, configure:

| Seção             | Recurso                               | Acesso |
| ----------------- | ------------------------------------- | ------ |
| Core              | Products                              | Write  |
| Core              | Customers                             | Write  |
| Core              | Events                                | Read   |
| Core              | Payment Intents                       | Write  |
| Billing           | Prices                                | Write  |
| Billing           | Subscriptions                         | Write  |
| Billing           | Customer Portal                       | Write  |
| Billing           | Invoices                              | Read   |
| Checkout Sessions | Checkout Sessions                     | Write  |
| Webhook Endpoints | Webhook Endpoints, Event Destinations | Write  |

Se o projeto utilizar descontos, configure também:

| Seção   | Recurso         | Acesso |
| ------- | --------------- | ------ |
| Billing | Coupons         | Write  |
| Billing | Promotion Codes | Write  |

Mantenha as demais permissões como **None**, principalmente acessos relacionados a saldo, repasses, disputas, Connect, Issuing, Tax e gerenciamento financeiro.

## 4. Gere e copie a chave

Clique em **Create key**.

A Stripe mostrará algo semelhante a:

```text
rk_test_ABCDEF...
```

Copie e guarde a chave em um local seguro. Não coloque essa chave no código do projeto, não faça commit dela no Git e não a compartilhe em mensagens ou documentações.

## 5. Coloque a chave no PowerShell

Para usar somente no terminal atual:

```powershell
$env:STRIPE_API_KEY = "rk_test_COLE_AQUI_A_CHAVE_DA_STRIPE"
```

Nesse caso, inicie o Codex na mesma janela do PowerShell:

```powershell
codex
```

Para salvar a variável no seu usuário do Windows:

```powershell
[Environment]::SetEnvironmentVariable(
    "STRIPE_API_KEY",
    "rk_test_COLE_AQUI_A_CHAVE_DA_STRIPE",
    "User"
)
```

Depois, feche e abra novamente o PowerShell.

Para verificar se a variável foi configurada sem exibir a chave completa:

```powershell
if ($env:STRIPE_API_KEY) {
    "Chave configurada: " + $env:STRIPE_API_KEY.Substring(0, 8) + "..."
} else {
    "Chave não encontrada"
}
```

## 6. Configure o MCP da Stripe no Codex

Abra o arquivo:

```text
~/.codex/config.toml
```

No Windows, normalmente ele corresponde a:

```text
C:\Users\SEU_USUARIO\.codex\config.toml
```

Adicione:

```toml
[mcp_servers.stripe]
url = "https://mcp.stripe.com"
bearer_token_env_var = "STRIPE_API_KEY"
```

O valor secreto não deve ser colocado no `config.toml`. O arquivo contém somente o nome da variável de ambiente.

## 7. Valide a configuração

Abra uma nova sessão do Codex e consulte os servidores MCP configurados:

```powershell
codex mcp list
```

Depois, peça ao Codex para verificar a conexão sem fazer alterações:

```text
Use o Stripe MCP para confirmar a conexão com minha conta e informar se estamos no ambiente de teste. Não crie, altere ou exclua nenhum recurso.
```

Somente depois dessa validação peça a criação dos produtos e preços.

## Cuidados importantes

- Utilize inicialmente apenas uma chave `rk_test_...`.
- Nunca use `pk_test_...` como chave do MCP.
- Não utilize chaves `rk_live_...` ou `sk_live_...` durante os testes.
- Não coloque a chave diretamente no `config.toml`.
- Não salve a chave em arquivos versionados pelo Git.
- Mantenha a confirmação humana habilitada para operações de escrita.
- Crie futuramente uma chave separada para a aplicação Next.js; não reutilize a chave administrativa do Codex em produção.

## Documentação oficial

- [Stripe MCP](https://docs.stripe.com/mcp)
- [Chaves da API Stripe](https://docs.stripe.com/keys)
- [Chaves restritas](https://docs.stripe.com/keys/restricted-api-keys)
