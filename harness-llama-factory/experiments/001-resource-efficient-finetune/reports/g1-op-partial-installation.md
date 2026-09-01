# G1-OP Partial Installation Review

**Decision**: `BLOCKED_PENDING_REVISED_G1_OP`
**Reviewed at**: `2026-08-22`
**Current approved gate**: `G1-OP` for the v2 lock
**Proposed replacement**: [g1-op-v4-proposal.json](../manifests/gates/g1-op-v4-proposal.json)

## Evidence

- CPython `3.12.12` was installed in the approved external environment.
- The approved v2 lock's 103 wheels were installed.
- LLaMA-Factory `0.9.5` was installed from the pinned revision
  `7af909522a951e3ad9f022ea6f88b6755257eaa5`.
- No model or dataset was retrieved; no data was prepared; no inference, baseline, dry validation or
  training was run.
- `uv pip check` found 18 missing platform-specific requirements declared by the installed
  `torch==2.9.1+xpu` wheel.
- The missing requirements are all represented by wheels and hashes in the v4 metadata lock.
- The current environment remains intentionally incomplete; none of the 18 additional wheels was
  installed.

## Blocking finding

The v2 approval covered 103 resolved requirements and cannot be silently extended to the 121-package
v4 graph. The v4 proposal increases the known transfer estimate from `937,082,760` bytes to
`1,665,242,560` bytes, an additional `728,159,800` bytes. Installed disk size remains an estimate
until the additional wheels are installed and measured.

## Required decision

The owner must explicitly approve the v4 lock hash
`E4C14B7F81B30B8D5958AC26D7CBB033E8BADF20FA56041DF87231AD1E04BD5A`, the 18 additional packages,
the additional transfer estimate, and the same external environment path. Model and dataset actions
remain outside this proposal.

## Superseded outcome after G1-OP-V4 approval

The owner approved `G1-OP-V4` on 2026-08-22. The resumed installation completed under the exact
v4 lock; the completion record is stored outside the repository at
`%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/reports/g1-op-installation.json`.

- Lock SHA-256: `E4C14B7F81B30B8D5958AC26D7CBB033E8BADF20FA56041DF87231AD1E04BD5A`.
- Python: `3.12.12`; resolved requirements: `121`.
- `uv pip check`: passed; all 18 additional XPU runtime packages are installed.
- LLaMA-Factory revision: `7af909522a951e3ad9f022ea6f88b6755257eaa5`.
- Free space: `598,926,209,024` bytes before and `595,399,143,424` bytes after installation.
- No model or dataset was retrieved, no data was prepared, and no inference or training was run.

The original blocked v2 finding remains preserved as historical evidence; G1-OP is now complete
under the v4 revision. G2 runtime validation and all model/data actions remain closed.
