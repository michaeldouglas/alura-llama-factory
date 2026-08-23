# Runtime Metadata Review — G1-METADATA-2

**Decision**: `BLOCKED`  
**G1-OP readiness**: `NOT READY`  
**Reviewed by**: `orchestrator`  
**Authorization**: [g1-metadata-2.json](../manifests/gates/g1-metadata-2.json)  
**Evidence**: [runtime-metadata-lock-g1-metadata-2-v2.json](../manifests/runtime-metadata-lock-g1-metadata-2-v2.json)

## Scope and execution

The owner-approved scope was executed with the exact allowlist and no payload downloads:

- 217 successful metadata requests: `GET` for JSON/index documents and `HEAD` for XPU wheels.
- Hosts used: `api.github.com`, `download.pytorch.org`, `download-r2.pytorch.org` and `pypi.org`.
- Five XPU wheel headers were inspected through `download-r2.pytorch.org`; the recorded payload state is `false`.
- No wheel, sdist, CPython archive, source repository, model or dataset payload was downloaded.
- No environment was created and no package was installed.

## Resolution evidence

- CPython: 3.12.12 x64 Windows; archive metadata size 21,794,659 bytes.
- Direct requirements: 32.
- Resolved target-compatible requirements: 103 total, including 72 applicable transitive requirements.
- Resolved wheel archive estimate: 915,330,769 bytes.
- Known Python plus resolved-wheel transfer estimate: 937,125,428 bytes.
- Installed disk size remains unresolved because compressed metadata cannot prove extraction size.
- The XPU candidates are `torch 2.9.1+xpu`, `torchvision 0.24.1+xpu` and `torchaudio 2.9.1+xpu`, with hashes and sizes preserved in the lock.

## Blocking finding

The active dependency graph requires `antlr4-python3-runtime==4.9.*`. The official metadata for the compatible 4.9 releases contains only source distributions; no CPython 3.12/Windows wheel exists. Source payloads and source builds are prohibited by the approved policy, so this dependency cannot be included in an installable locked runtime under the current specification.

The lock is therefore `INCOMPLETE_METADATA_ONLY_LOCK`, with one unresolved requirement. This is a technical `BLOCKED` result, not a permission to use a source build, a different Python version, CPU, WSL, remote compute or a different package constraint.

## Decision and next action

G1-OP remains closed. No environment creation, dependency installation, model retrieval, dataset retrieval, data preparation, inference, dry validation or training may begin.

The owner must first choose a reviewed remediation: revise the dependency constraints/specification to a supported wheel-backed graph, or accept this experiment as `BLOCKED`. A revised dependency graph would require a new metadata lock and review; it does not authorize installation by itself.
