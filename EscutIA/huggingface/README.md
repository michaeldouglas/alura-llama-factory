# Preparação para publicar modelos no Hugging Face — EscutIA

Este diretório reúne as orientações para preparar a conta e o repositório do projeto no Hugging Face.

Nesta etapa, o objetivo é somente deixar a conta pronta para a publicação futura dos modelos LoRA e QLoRA. Os arquivos `modelos/lora.zip` e `modelos/qlora.zip` serão tratados em uma etapa posterior e não são utilizados por este tutorial.

## Organização da pasta

```text
huggingface/
├── main.py                 # menu do aplicativo EscutAI Modelos
├── requirements.txt        # dependências independentes desta pasta
├── modelos/
│   ├── lora.zip
│   ├── qlora.zip
│   └── completos/           # criado pelo merge do LoRA
└── script/
    ├── preparar_lora_zip.py
    └── mesclar_lora.py
```

Para instalar somente o que este aplicativo precisa, abra um terminal nesta pasta e execute:

```bash
python -m pip install -r requirements.txt
python main.py
```

O menu do aplicativo possui estas opções:

1. Preparar zips dos modelos.
2. Configurar Hugging Face.
3. Mesclar modelo completo LoRA — QLoRA: Fazer no Colab.
4. Subir modelos — LoRA completo + QLoRA ZIP.

Na opção 2, o token é solicitado com a entrada oculta e validado sem ser salvo
no projeto. Na opção 3, o adapter LoRA é mesclado localmente ao modelo-base e
salvo em `modelos/completos/escutia-lora`. Para o QLoRA, o menu exibe o aviso
`Fazer no Colab`, pois o merge deve ser realizado no ambiente NVIDIA usado no
treinamento QLoRA.

Na opção 4, o aplicativo envia o modelo LoRA completo e continua enviando o
QLoRA como adapter a partir do ZIP:

- `mdba/escutia-lora` recebe `modelos/completos/escutia-lora`;
- `mdba/escutia-qlora` recebe `modelos/qlora.zip`.

O QLoRA não é enviado como um único arquivo ZIP. Seu conteúdo é extraído
temporariamente e publicado na raiz do repositório, que é o formato esperado
para carregá-lo com o modelo-base.

O modelo LoRA completo é enviado diretamente da pasta gerada pelo merge. Ele
contém os pesos completos e pode ser carregado com `transformers` sem aplicar
um adapter PEFT separadamente.

Durante o upload, o aplicativo garante que o `README.md` contenha o bloco YAML
de metadados do Model Card, incluindo o modelo-base, a biblioteca PEFT, o idioma
e a tarefa. Isso evita o aviso de metadados ausentes exibido pelo Hugging Face.

## O que será necessário

- Uma conta no [Hugging Face](https://huggingface.co/).
- Seu nome de usuário no Hugging Face.
- Um token de acesso com permissão de escrita.
- Um repositório de modelo para receber os artefatos.
- Uma decisão sobre deixar o repositório público ou privado.

Os resultados de LoRA e QLoRA são adapters. Um adapter não é, sozinho, um modelo completo: ele depende do modelo-base compatível para ser carregado e utilizado.

## 1. Criar a conta

1. Acesse [huggingface.co/join](https://huggingface.co/join).
2. Preencha o cadastro ou entre usando uma conta existente.
3. Confirme o e-mail caso o Hugging Face solicite essa confirmação.
4. Abra seu perfil e anote o nome de usuário.

O nome de usuário aparece no endereço do perfil. Por exemplo, em `https://huggingface.co/maria`, o nome de usuário é `maria`.

## 2. Criar um token de acesso

O token será usado posteriormente pelo notebook do Colab para enviar os arquivos ao Hugging Face.

1. Acesse [Settings > Access Tokens](https://huggingface.co/settings/tokens).
2. Selecione **New token**.
3. Informe um nome que identifique o uso, por exemplo: `escutia-colab-upload`.
4. Escolha a permissão **Write**.
5. Crie o token.
6. Copie o valor exibido e guarde-o em um local seguro.

Para este curso, a permissão **Write** é necessária porque a publicação precisa criar ou atualizar arquivos no repositório. Se preferir restringir o acesso, use um token **fine-grained** com permissão de escrita somente no repositório do EscutIA.

### Cuidados com o token

- Não coloque o token diretamente no notebook.
- Não salve o token em um arquivo do projeto.
- Não publique o token no GitHub, em screenshots ou em mensagens.
- Use um token separado para este projeto.
- Se o token for exposto, revogue-o imediatamente e crie outro.

O token é uma credencial, assim como uma senha. Consulte a documentação de [segurança dos tokens](https://huggingface.co/docs/hub/security-tokens) para conhecer as permissões disponíveis.

## 3. Criar o repositório do modelo

Será possível criar um repositório para cada resultado. Essa separação deixa claro qual adapter foi treinado com cada técnica.

1. Acesse [huggingface.co/new](https://huggingface.co/new).
2. Em **Owner**, selecione seu usuário.
3. Em **Name**, escolha um nome, por exemplo:
   - `escutia-lora`
   - `escutia-qlora`
4. Mantenha o tipo **Model**.
5. Escolha **Public** ou **Private**.
6. Clique em **Create model**.

Depois da criação, anote o identificador do repositório no formato:

```text
seu-usuario/escutia-qlora
```

Substitua `seu-usuario` pelo nome real da sua conta. O mesmo formato será utilizado futuramente para o repositório do LoRA.

### Público ou privado?

- **Público:** qualquer pessoa poderá encontrar e baixar os arquivos.
- **Privado:** somente você e os colaboradores autorizados terão acesso.

Para o material do curso, deixar o repositório privado durante a preparação é uma opção segura. A visibilidade pode ser revisada posteriormente, antes da publicação final.

## 4. Preparar o segredo no Google Colab

Quando for executar o notebook no Colab:

1. Abra o notebook no Google Colab.
2. Na barra lateral esquerda, abra o ícone de **Secrets** ou **chave**.
3. Crie um segredo com o nome exato:

```text
HF_TOKEN
```

4. Cole o token criado no passo anterior.
5. Habilite o acesso desse notebook ao segredo, se o Colab solicitar.

O notebook poderá ler o segredo durante a execução sem que o valor fique escrito no código salvo. O [guia rápido do Hugging Face Hub](https://huggingface.co/docs/huggingface_hub/quick-start) também documenta o uso de `HF_TOKEN` e de secrets no Colab.
