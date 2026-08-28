# Implementation Plan: Integração read-only do harness com EscutIA

## Summary

Adicionar uma integração isolada no harness que consuma o dataset preparado e a configuração LoRA existentes do `EscutIA/`, mantendo `EscutIA/platform/` como contexto separado da aplicação. A integração terá perfil versionado, preflight read-only, renderizador de configuração LLaMA-Factory, regras explícitas de roteamento e testes. A feature `001-resource-efficient-finetune` permanece histórica e inalterada.

## Technical Context

**Language/Version**: Python 3.12  
**Dependencies**: biblioteca padrão para a preflight; `pytest` já usado pelo projeto raiz para testes
**Storage**: perfil, scripts, testes e documentação no harness; caches, logs, checkpoints e outputs somente no `%LOCALAPPDATA%` externo  
**Testing**: `uv run --python 3.12 pytest integrations/escutia/tests`  
**Target**: projeto irmão `../EscutIA`, validado por nome e existência  
**Application context**: `../EscutIA/platform/`, com `site/` e `api/` como áreas separadas do fluxo de fine-tuning  
**Agent contract**: os arquivos `.codex/agents/*.md` e `.codex/agents/*.toml` devem expressar o mesmo contrato de integração e delegação
**Write mode**: o padrão protege a versão estável do EscutIA em modo read-only; uma evolução explicitamente solicitada pode escrever somente no escopo aprovado, preservando a versão anterior e validando o resultado
**Constraints**: nenhuma escrita automática no EscutIA; nenhuma execução automática de preparação, inferência ou treinamento; não sobrescrever configuração externa; uma única política de ignorados no `.gitignore` da raiz

## Constitution Check

- Spec Kit antes da implementação: PASS — esta feature tem spec, plan e tasks próprios.
- Orquestração e skills: PASS — os arquivos Markdown e TOML ligam o orchestrator à preflight, o dataset-specialist à validação com `dataset-preparation` e o training-engineer à proposta com `fine-tuning-strategy` e `llama-factory`.
- Integridade dos dados: PASS — apenas leitura dos derivados já existentes; nenhuma alteração da fonte.
- Estratégia orientada a recursos: PASS — a proposta preserva LoRA, batch 1, acumulação 8 e sequência 256 para revisão posterior; não executa.
- Reprodutibilidade: PASS — identidades, revisão, seed, paths e política de saída ficam versionados.
- Graphify único: PASS — o único grafo ativo será `./graphify-out`, mantido junto do harness.

## Project Structure

### Documentation (this feature)

```text
specs/002-escutia-integration/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
integrations/escutia/
├── README.md
├── escutia-integration.json
├── scripts/
│   ├── validate_escutia_integration.py
│   └── render_escutia_config.py
└── tests/test_escutia_integration.py
```

The integration does not add files under `EscutIA/`.

The platform context is documented separately in `integrations/escutia-platform/`
and `EscutIA/platform/AGENTS.md`. Its site and API are not scanned as training
artifacts and do not change the read-only fine-tuning integration.

The operational agent configurations in `.codex/agents/` are part of the harness
contract and must remain aligned between their Markdown documentation and TOML
runtime definitions.

The repository-wide ignore policy lives only in `../.gitignore`; nested project `.gitignore` files are intentionally not maintained.

## Data Flow

```text
EscutIA prepared files/reports (read-only)
        ↓
validate_escutia_integration.py
        ↓ READY / BLOCKED
render_escutia_config.py → external LOCALAPPDATA proposal/output paths
```

The preflight never writes a report to the target. It emits evidence to stdout;
the current renderer writes only below the approved external root. Future
project evolution is an explicit, scoped mode and must preserve the prior
revision and run post-change validation.

The application context is routed independently:

```text
EscutIA/platform/site → EscutIA/platform/api → product/backend services
EscutIA prepared artifacts → fine-tuning preflight → rendered LLaMA-Factory proposal
```

## Complexity Tracking

No constitution violation or complexity exception is required.
