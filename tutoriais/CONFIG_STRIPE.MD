# Configurações da Stripe no Codex

Como nosso projeto utiliza o MCP da Stripe, será necessário criar uma chave restrita no ambiente de teste da Stripe e disponibilizá-la ao Codex por meio de uma variável de ambiente.

> **Importante:** faça toda a configuração inicial em **Sandbox/Test mode**. Assim, produtos, preços, clientes e assinaturas de teste não afetarão dados reais nem movimentarão dinheiro.

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

Para permitir que o Codex crie os planos e auxilie no planejamento da integração, configure:

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
| Connect           | Accounts                              | Read   |
| Webhook Endpoints | Webhook Endpoints, Event Destinations | Write  |

O acesso **Connect → Accounts → Read** permite que o MCP confirme o nome e o ID da conta Stripe conectada. Não confunda essa opção com **Core → Account Evaluations**.

Se o projeto utilizar descontos, configure também:

| Seção   | Recurso         | Acesso |
| ------- | --------------- | ------ |
| Billing | Coupons         | Write  |
| Billing | Promotion Codes | Write  |

Mantenha as demais permissões como **None**, principalmente os acessos relacionados a saldo, repasses, disputas, Issuing, Tax e gerenciamento financeiro.

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

## 8. Crie uma chave separada para a aplicação

A chave administrativa utilizada pelo Codex/MCP não deve ser reutilizada no site.

Quando iniciar a integração com o Next.js, volte para:

[Stripe Dashboard — API keys](https://dashboard.stripe.com/test/apikeys)

Crie outra chave restrita, por exemplo:

- **Key name:** EscutIA Next.js Sandbox
- **Environment:** Sandbox/Test mode
- **Purpose/Description:** Integração server-side da EscutIA com a Stripe

Copie a chave completa `rk_test_...` e coloque no arquivo local de variáveis de ambiente da aplicação:

```env
STRIPE_SECRET_KEY="rk_test_CHAVE_COMPLETA_DA_APLICACAO"
```

> A variável se chama `STRIPE_SECRET_KEY`, mas pode receber uma chave restrita `rk_test_...`. Ela deve existir somente no servidor e nunca utilizar o prefixo `NEXT_PUBLIC_`.

## 9. Configure o webhook local

O segredo do webhook é diferente da chave da API. Para testar localmente, instale a Stripe CLI, autentique-se e encaminhe os eventos para a aplicação:

```powershell
stripe login
```

```powershell
stripe listen --forward-to http://localhost:3000/api/billing/webhook
```

O terminal exibirá um segredo iniciado por `whsec_`. Copie o valor completo:

```env
STRIPE_WEBHOOK_SECRET="whsec_CHAVE_COMPLETA_DO_LISTENER_LOCAL"
```

Esse segredo pertence ao listener local. Cada endpoint de webhook hospedado terá seu próprio segredo.

Você também pode consultar os endpoints no Dashboard:

[Webhooks no Sandbox](https://dashboard.stripe.com/test/workbench/webhooks)

## 10. Mantenha o Cuidado Humano desativado

Essa configuração não vem da Stripe. Ela é uma decisão operacional da EscutIA.

Enquanto não existirem profissionais habilitados, agenda, termos e processo de atendimento, mantenha:

```env
ESCUTIA_HUMAN_CARE_ENABLED="false"
```

Somente altere para `true` quando a operação do atendimento humano estiver pronta.

## 11. Configure o Customer Portal

Configure o portal no ambiente de teste:

[Customer Portal da Stripe](https://dashboard.stripe.com/test/settings/billing/portal)

Para o início, permita:

- atualização do método de pagamento;
- cancelamento ao final do período;
- visualização de faturas;
- mudança somente entre os planos Essencial e Premium.

Não inclua o plano Cuidado Humano enquanto ele estiver desativado e não permita alteração de quantidade, pois os planos não são cobrados por assentos.

Se a aplicação utilizar a configuração padrão do portal, mantenha:

```env
STRIPE_BILLING_PORTAL_CONFIGURATION=""
```

Um identificador `bpc_...` será necessário somente se uma configuração específica do portal for criada pela API.

## 12. Exemplo final das variáveis da aplicação

```env
# Stripe Sandbox — somente no servidor
STRIPE_SECRET_KEY="rk_test_CHAVE_COMPLETA_DA_APLICACAO"
STRIPE_WEBHOOK_SECRET="whsec_CHAVE_COMPLETA_DO_LISTENER_LOCAL"

# Cuidado Humano permanece indisponível
ESCUTIA_HUMAN_CARE_ENABLED="false"

# Vazio para utilizar a configuração padrão do Customer Portal
STRIPE_BILLING_PORTAL_CONFIGURATION=""
```

## Cuidados importantes

- Utilize inicialmente apenas chaves `rk_test_...`.
- Nunca use `pk_test_...` como chave do MCP ou como chave secreta da aplicação.
- Não utilize chaves `rk_live_...` ou `sk_live_...` durante os testes.
- Não coloque a chave diretamente no `config.toml`.
- Não salve chaves no Git.
- Mantenha a confirmação humana habilitada para operações de escrita do MCP.
- Utilize chaves diferentes para o Codex/MCP e para a aplicação Next.js.
- Utilize segredos de webhook diferentes para desenvolvimento local, homologação e produção.
- Nunca coloque dados de conversas, sentimentos ou registros emocionais nos metadados da Stripe.

## Documentação oficial

- [Stripe MCP](https://docs.stripe.com/mcp)
- [Chaves da API Stripe](https://docs.stripe.com/keys)
- [Chaves restritas](https://docs.stripe.com/keys/restricted-api-keys)
- [Webhooks da Stripe](https://docs.stripe.com/webhooks)
- [Customer Portal](https://docs.stripe.com/customer-management/configure-portal)
