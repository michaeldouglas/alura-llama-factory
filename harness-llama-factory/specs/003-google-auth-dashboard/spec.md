# Feature Specification: Google Auth e dashboard EscutIA

**Feature Branch**: `feature/google-auth-dashboard`  
**Created**: 2026-08-28  
**Status**: Approved for implementation in `EscutIA/platform/site` only

## User Scenarios & Testing

### User Story 1 - Entrar com Google (Priority: P1)

Como visitante da EscutIA, quero clicar em “Entrar”, ver um modal de acesso e
continuar com minha conta Google, para acessar uma área pessoal sem criar uma
senha local.

**Independent Test**: Ao clicar em “Entrar”, o modal exibe a opção Google; após
um retorno OAuth válido, o usuário é autenticado e redirecionado para o
dashboard. Sem credenciais configuradas, o sistema informa a configuração
necessária sem expor segredos.

### User Story 2 - Persistir o usuário localmente (Priority: P1)

Como responsável pelo produto, quero guardar localmente a identidade do usuário
e os dados da sessão em SQLite, para não depender de uma infraestrutura externa
de banco nesta etapa.

**Independent Test**: Depois do primeiro login, o SQLite contém o usuário,
conta Google e sessão; em uma nova requisição, os dados do usuário continuam
disponíveis sem recriar a conta.

### User Story 3 - Usar uma área protegida (Priority: P1)

Como usuário autenticado, quero ser levado a um dashboard com meu nome, foto e
e-mail, enquanto visitantes não autenticados devem ser redirecionados para a
página inicial.

**Independent Test**: Usuário autenticado acessa `/dashboard` e vê seus dados;
usuário sem sessão acessa `/dashboard` e retorna para `/` sem visualizar o
conteúdo protegido. O botão de sair encerra a sessão.

### User Story 4 - Continuar para o espaço de conversa (Priority: P1)

Como usuário autenticado, quero que o botão “Conversar agora” me leve ao espaço
de conversa da EscutIA; como visitante, quero ser convidado a entrar antes de
continuar, para que o futuro chat seja acessível somente com uma sessão válida.

**Independent Test**: Usuário autenticado vê “Dashboard” no lugar de “Entrar” e
acessa `/dashboard`; ao selecionar “Conversar agora”, chega a `/chat`. Visitante
vê “Entrar” e, ao selecionar “Conversar agora”, abre o modal Google e, depois do
login, retorna para `/chat`.

### User Story 5 - Acompanhar sentimentos por período (Priority: P1)

Como usuário autenticado, quero abrir primeiro uma visão geral com gráficos dos
meus registros de sentimento, filtrada por período e por sentimento, para
perceber como tenho estado ao longo dos dias.

**Independent Test**: Usuário autenticado acessa `/dashboard`, vê o menu lateral
e um gráfico de barras agrupadas por dia com os totais de sentimentos positivos,
neutros e negativos. Ao escolher datas ou sentimentos e aplicar o filtro, o
gráfico e os resumos são atualizados apenas com seus próprios registros.

O conteúdo anterior de dados da conta permanece disponível em
`/dashboard/profile`.

## Edge Cases

- Credenciais Google ausentes ou inválidas.
- Usuário cancela o consentimento ou o provedor retorna erro.
- Foto ou nome não estão presentes no perfil Google.
- Arquivo SQLite ainda não foi criado.
- Usuário autenticado tenta acessar novamente a tela inicial.
- Sessão ainda está carregando enquanto os CTAs são exibidos.
- Usuário autenticado acessa o destino futuro do chat antes da implementação da
  conversa.
- A aplicação é iniciada em produção sem armazenamento persistente para o SQLite.
- Um arquivo `.env.local` real ou um banco SQLite é selecionado para entrar no Git.

## Requirements

### Functional Requirements

- **FR-001**: O sistema MUST oferecer um botão “Entrar” na página inicial que
  abra um modal com a opção de login do Google.
- **FR-002**: O sistema MUST autenticar via OAuth do Google e redirecionar o
  usuário autenticado para `/dashboard`.
- **FR-003**: O sistema MUST persistir usuários, contas OAuth e sessões no SQLite
  local da aplicação.
- **FR-004**: A rota `/dashboard` MUST exigir uma sessão válida e MUST
  redirecionar visitantes não autenticados para `/`.
- **FR-005**: O dashboard MUST exibir nome, foto e e-mail quando fornecidos pelo
  Google, usando fallback seguro quando nome ou imagem estiverem ausentes.
- **FR-006**: O sistema MUST permitir encerrar a sessão e retornar o usuário à
  página inicial.
- **FR-007**: Segredos e credenciais MUST ser lidos de variáveis de ambiente do
  servidor, incluindo `.env.local` no desenvolvimento, e MUST NOT ser incluídos
  no código, no banco ou no controle de versão.
- **FR-008**: O projeto MUST manter `.env.local`, arquivos SQLite locais e
  artefatos de desenvolvimento fora do GitHub.
- **FR-009**: A API e a autenticação MUST executar no runtime Node.js do Next.js;
  a implementação não deve criar um serviço separado nesta etapa.
- **FR-010**: Esta feature MUST NOT implementar Stripe, planos, cobrança,
  inferência de modelo ou integração com o harness de fine-tuning.
- **FR-011**: Quando houver uma sessão válida, o controle “Entrar” MUST ser
  substituído por um link para `/dashboard`; durante o carregamento da sessão,
  a interface MUST evitar uma ação incorreta.
- **FR-012**: O botão “Conversar agora” MUST levar usuários autenticados para
  `/chat`; para visitantes, MUST abrir o modal Google com `/chat` como destino
  após o login.
- **FR-013**: A rota `/chat` MUST exigir uma sessão válida e, até a
  implementação da conversa, MUST exibir uma tela de preparação sem expor
  conteúdo protegido a visitantes.
- **FR-014**: A rota protegida `/dashboard` MUST carregar primeiro a visão geral
  analítica de sentimentos, com menu lateral para visão geral, conversa e perfil.
- **FR-015**: O dashboard MUST oferecer filtro de data inicial, data final e
  sentimentos positivo, neutro e negativo.
- **FR-016**: O gráfico MUST agrupar os registros do usuário por dia e exibir a
  quantidade de cada sentimento selecionado, incluindo estado vazio quando não
  houver registros no recorte.
- **FR-017**: A API de resumo MUST validar a sessão, limitar o período consultado
  e nunca retornar registros pertencentes a outro usuário.
- **FR-018**: A URL MUST preservar os filtros aplicados para permitir recarregar
  ou compartilhar a visão filtrada dentro da área autenticada.

## Key Entities

- **User**: identidade local do usuário autenticado.
- **Account**: vínculo do usuário com a conta Google OAuth.
- **Session**: sessão persistida usada para proteger o dashboard.

## Success Criteria

- **SC-001**: Um visitante consegue iniciar o login pelo modal e chegar ao
  dashboard após autenticação Google válida.
- **SC-002**: O dashboard exibe os dados do perfil autenticado sem permitir que
  um visitante não autenticado veja seu conteúdo.
- **SC-003**: O mesmo usuário Google é reconhecido em novos acessos sem duplicar
  o registro local.
- **SC-004**: Nenhum segredo real aparece em arquivos rastreados pelo Git ou no
  bundle enviado ao navegador.
- **SC-005**: A aplicação inicia e informa claramente quando a configuração do
  OAuth ou do SQLite está incompleta.
- **SC-006**: A navegação para dashboard e para o futuro chat respeita a sessão
  atual e preserva o destino escolhido durante o login.
- **SC-007**: Um usuário consegue identificar, por dia, quantos registros foram
  positivos, neutros ou negativos no período escolhido.
- **SC-008**: O perfil continua acessível em rota própria sem substituir a visão
  geral do dashboard.

## Assumptions

- O Google OAuth será configurado pelo responsável no Google Cloud Console.
- O desenvolvimento usa `.env.local`, que não será criado com credenciais pelo
  agente.
- O SQLite será adequado enquanto a aplicação usar um servidor com disco
  persistente; a hospedagem será revisitada antes de produção.
- O modelo de IA e o Stripe serão tratados em funcionalidades posteriores.
