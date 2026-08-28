# Implementation Plan: Integração read-only do harness com EscutIA

## Summary

Adicionar uma integração isolada no harness que consuma o dataset preparado e a configuração LoRA existentes do `EscutIA/`. A integração terá perfil versionado, preflight read-only, renderizador de configuração LLaMA-Factory e testes. A feature `001-resource-efficient-finetune` permanece histórica e inalterada.

## Technical Context

**Language/Version**: Python 3.12  
**Dependencies**: biblioteca padrão para a preflight; `pytest` já usado pelo harness para testes  
**Storage**: perfil, scripts, testes e documentação no harness; caches, logs, checkpoints e outputs somente no `%LOCALAPPDATA%` externo  
**Testing**: `uv run --python 3.12 pytest integrations/escutia/tests`  
**Target**: projeto irmão `../EscutIA`, validado por nome e existência  
**Constraints**: nenhuma escrita no EscutIA; nenhuma execução automática de preparação, inferência ou treinamento; não sobrescrever configuração externa

## Constitution Check

- Spec Kit antes da implementação: PASS — esta feature tem spec, plan e tasks próprios.
- Orquestração e skills: PASS — o perfil liga o orchestrator à preflight, o dataset-specialist à validação e o training-engineer à proposta; as skills aplicáveis foram consultadas.
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

## Data Flow

```text
EscutIA prepared files/reports (read-only)
        ↓
validate_escutia_integration.py
        ↓ READY / BLOCKED
render_escutia_config.py → external LOCALAPPDATA proposal/output paths
```

The preflight never writes a report to the target. It emits evidence to stdout; an explicit config output may be written only below the approved external root and only when the destination does not exist.

## Complexity Tracking

No constitution violation or complexity exception is required.
