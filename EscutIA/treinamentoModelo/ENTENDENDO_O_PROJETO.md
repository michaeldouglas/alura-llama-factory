# ENTENDENDO_O_PROJETO — etapa de treinamento do modelo

Este documento explica a etapa técnica do treinamento dentro do projeto EscutIA. O README oficial em `EscutIA\README.md` apresenta a empresa, o produto e a visão completa da plataforma. Aqui tratamos somente do modelo que será usado como uma capacidade do agente futuro.

## O que está sendo construído

A primeira capacidade treinada é a classificação de sentimento em textos curtos em português:

- `positivo`;
- `neutro`;
- `negativo`.

Exemplo:

```text
Entrada: "Adorei o atendimento, foi excelente."
Saída:   positivo
```

Essa capacidade poderá ajudar o agente a compreender como a pessoa está se sentindo antes de decidir como conduzir a conversa ou se deve orientar a busca por ajuda especializada.

## O que o modelo é e o que ele não é

O modelo treinado é uma capacidade especializada. Ele não é, sozinho:

- o agente EscutIA completo;
- uma interface de conversa;
- um sistema com memória;
- um sistema de diagnóstico;
- um tratamento psicológico;
- um sistema que executa ações;
- um substituto para psicólogos ou outros profissionais.

O agente futuro será responsável por receber a mensagem, consultar as capacidades corretas, aplicar regras de segurança, manter o contexto e decidir como responder.

## Modelo base, dataset e adapter

### Modelo base

O modelo base é o `Qwen/Qwen2.5-0.5B-Instruct`. Ele já possui capacidade geral de seguir instruções, mas não foi preparado especificamente para a classificação de sentimento usada pelo EscutIA.

### Dataset

O script `preparar_dataset.py` baixa uma revisão fixa, preserva a fonte original, valida campos e rótulos, remove ou redige registros problemáticos, verifica duplicatas e gera o formato Alpaca em `data\derived`.

### Adapter LoRA

O treinamento usa LoRA para não precisar regravar todos os pesos do modelo base. O resultado é um conjunto de pesos adicionais chamado adapter.

```text
modelo base + adapter LoRA = modelo adaptado do EscutIA
```

O modelo base fica em `models`. O adapter treinado fica em `outputs\...\checkpoint-XXX`. O script `testar_modelo.py` carrega os dois juntos.

## Fluxo desta etapa

```text
requirements.txt
        ↓
baixar_modelo.py ───────→ models/
        ↓
preparar_dataset.py ────→ data/source/ e data/derived/
        ↓
treinar.py ──────────────→ outputs/.../checkpoint-XXX
        ↓
testar_modelo.py ────────→ positivo, neutro ou negativo
        ↓
integração futura ───────→ agente EscutIA
```

Cada script tem uma função específica. A pessoa consegue executar o treinamento sem depender de Codex, agentes ou outra pasta do repositório.

## Estrutura da pasta

```text
treinamentoModelo/
├── README.md
├── ENTENDENDO_O_PROJETO.md
├── COMO_ENCONTRAR_O_MODELO.md
├── requirements.txt
├── config/
│   └── sft-lora-template.yaml
├── scripts/
│   ├── baixar_modelo.py
│   ├── preparar_dataset.py
│   ├── treinar.py
│   └── testar_modelo.py
├── models/                        # criado depois do download
├── data/                          # criado durante a preparação
└── outputs/                       # criado durante o treinamento
```

O documento oficial do produto fica em `EscutIA\README.md`. O guia operacional fica em `EscutIA\treinamentoModelo\README.md`.

## Execução manual

Dentro de `EscutIA\treinamentoModelo`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python scripts\baixar_modelo.py
python scripts\preparar_dataset.py
python scripts\treinar.py --confirm
python scripts\testar_modelo.py
```

Ao concluir, `outputs\ULTIMO_TREINAMENTO.txt` informa o caminho exato do checkpoint final e o comando para testar o adapter.

## Como o agente usará o modelo futuramente

O agente será construído acima desta etapa. A inferência deverá virar uma capacidade que o código do agente possa chamar:

```text
Mensagem da pessoa
        ↓
Agente recebe e normaliza a entrada
        ↓
Agente decide se precisa analisar o sentimento
        ↓
Modelo base + adapter EscutIA
        ↓
Retorna: positivo/neutro/negativo
        ↓
Agente aplica regras de segurança e contexto
        ↓
Agente responde, acolhe ou orienta ajuda profissional
```

Exemplo conceitual:

```python
sentimento = escutia_modelo.classificar(texto)

if sentimento == "negativo":
    agente.iniciar_acolhimento_e_avaliar_necessidade_de_orientacao()
elif sentimento == "positivo":
    agente.registrar_feedback_positivo()
else:
    agente.continuar_conversa_normalmente()
```

Esse código é apenas a ideia da integração futura. O modelo não deve decidir sozinho sobre situações sensíveis; o agente precisará aplicar regras, validações e encaminhamentos seguros.

## Responsabilidades separadas

| Responsabilidade | Modelo treinado | Agente futuro |
|---|---:|---:|
| Identificar sentimento | Sim | Usa e valida o resultado |
| Escolher o rótulo | Sim | Pode revisar o contexto |
| Manter memória da conversa | Não | Sim |
| Conduzir conversa acolhedora | Limitado | Sim |
| Orientar ajuda profissional | Não sozinho | Sim, com regras de segurança |
| Executar uma ação | Não | Sim |
| Controlar permissões e privacidade | Não | Sim |
| Conectar a profissionais | Não | Futuramente |

## Resultado de referência

O experimento de referência avaliou 90 exemplos, com 30 por classe:

- acurácia base: `50,00%`;
- acurácia adaptada: `68,89%`;
- macro-F1 base: `0,4044`;
- macro-F1 adaptado: `0,6891`;
- respostas inválidas do adapter: `0%`.

Esse resultado confirma que a etapa produziu uma capacidade útil para a tarefa escolhida. Ele não significa que a plataforma de bem-estar emocional ou o agente completo já estejam prontos.

## Próximas etapas técnicas

1. Transformar `testar_modelo.py` em um módulo reutilizável pelo agente.
2. Criar o núcleo que recebe mensagens e escolhe capacidades.
3. Adicionar regras de segurança e limites para situações sensíveis.
4. Implementar contexto e memória com privacidade.
5. Criar ferramentas controladas e encaminhamento para ajuda profissional.
6. Avaliar o comportamento do agente, não apenas a classificação do modelo.

## Resumo

O EscutIA é a empresa e o agente de bem-estar emocional. `treinamentoModelo` é uma etapa técnica do projeto: prepara uma capacidade de análise de sentimento em português para que o agente possa escutar melhor, personalizar a conversa e conduzir o usuário com responsabilidade.
