# Runtime Metadata Review — G1-METADATA-2 Remediation

**Decision**: `READY_FOR_G1_OP_REVIEW`
**Gate**: `G1-METADATA-2-REMEDIATION`
**Reviewed by**: `orchestrator`
**Reviewed at**: `2026-08-22`
**Owner authorization**: recorded in `experiments/001-resource-efficient-finetune/manifests/governance.json`
**Evidence**: [runtime-metadata-lock-g1-metadata-2-omegaconf-2.0.6-v2.json](../manifests/runtime-metadata-lock-g1-metadata-2-omegaconf-2.0.6-v2.json)

## Scope

The owner authorized a metadata-only dependency remediation after the first recursive lock was
blocked by `antlr4-python3-runtime==4.9.*`. The remediation evaluated the explicit override
`omegaconf==2.0.6` while preserving LLaMA-Factory v0.9.5 at revision
`7af909522a951e3ad9f022ea6f88b6755257eaa5`.

The previous blocked lock and the first remediation attempt remain immutable. The first remediation
attempt exposed a resolver-only parsing problem with the legacy metadata spelling `PyYAML (>=5.1.*)`;
the corrected v2 run preserved the partial artifact and reran the complete metadata-only resolution.

## Evidence

- CPython: `3.12.12` x64 Windows, python-build-standalone asset
  `cpython-3.12.12+20251120-x86_64-pc-windows-msvc-install_only_stripped.tar.gz`.
- Python asset SHA-256: `70ecfaf0bfc58298db11d6389be92c29ec4ef8cd93ebb6a7e54b41d9fc056b10`.
- Direct requirements: `32`.
- Resolved requirements: `103`, including `71` applicable transitive requirements.
- Lock status: `COMPLETE_METADATA_ONLY_LOCK`.
- Override: `omegaconf==2.0.6`, with universal wheel SHA-256
  `9e349fd76819b95b47aa628edea1ff83fed5b25108608abdd6c7fdca188e302a`.
- `PyYAML==6.0.3` selected with CPython 3.12/Windows wheel metadata.
- `antlr4-python3-runtime` is absent from the resolved graph.
- Known transfer estimate, including Python archive and all resolved wheel archives:
  `937,082,760` bytes.
- Resolved wheel archives: `915,288,101` bytes.
- Installed disk size and complete cache size remain unprovable from compressed metadata alone.
- Metadata requests used only `GET` and `HEAD`; payload downloads: `false`.
- Environment created: `false`; packages installed: `false`.

## Assessment

The dependency graph is now complete under the wheel-only CPython 3.12/Windows policy. The
OmegaConf pin is a compatibility candidate, not proof of runtime compatibility; G2 must validate
LLaMA-Factory imports, configuration behavior, dependency health and synthetic XPU operation after
an authorized installation.

The known transfer estimate is below the observed free space on `C:`. Because extracted disk usage
is not available from the metadata lock, the G1-OP proposal must retain a storage stop condition and
must not claim an exact installed footprint.

## G1-OP proposal boundary

This review makes the experiment ready for owner review of G1-OP. It does not approve G1-OP and does
not authorize any operational action. A future G1-OP record must explicitly approve, at minimum:

- isolated environment path under `%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/`;
- CPython 3.12.12 identity and the exact v2 metadata lock;
- the resolved package set and the PyTorch XPU index endpoints;
- the known transfer estimate and an acceptable storage budget/stop condition;
- no source builds, no silent CPU fallback, no model or dataset retrieval, and no training in G1.

Until that record exists and validates, G1-OP, G2, G2-OP, G3 and all later gates remain closed.
