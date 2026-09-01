# Configurações

Como nosso Harness utiliza o MCP do GitHub você deverá entrar em: [personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) e gerar uma chave.

## 2. Preencha os dados

Use, por exemplo:

- Token name: Codex GitHub MCP

- Description: Acesso do Codex ao GitHub pelo MCP
- Expiration: 30 days ou 90 days
- Resource owner: sua conta do GitHub
- Repository access: Only select repositories
- Selecione somente o repositório que o Codex utilizará.

Para o nosso projeto:
`michaeldouglas/alura-llama-factory`

## 3. Configure as permissões

Em Repository permissions, para consultar código, issues e pull requests:

| Permissão     | Acesso                            |
| ------------- | --------------------------------- |
| Metadata      | Read-only, normalmente automático |
| Contents      | Read and write                    |
| Issues        | Read and write                    |
| Pull requests | Read and write                    |
| Actions       | Read-only                         |

Contents: Read and write será necessário se você quiser que o MCP crie branches ou altere arquivos. Se quiser somente leitura, coloque tudo como Read-only.

## 4. Gere e copie

Clique em:

`Generate token`

O GitHub mostrará algo semelhante a:

`github_pat_11ABCDEF...`

Copie imediatamente, pois o GitHub pode não mostrar o token completo novamente.

## 5. Coloque no PowerShell

Para usar somente no terminal atual:

```bash
$env:GITHUB_PERSONAL_ACCESS_TOKEN = "github_pat_COLE_AQUI_O_TOKEN"
```
