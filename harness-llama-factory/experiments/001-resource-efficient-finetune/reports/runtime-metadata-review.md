# Runtime Metadata Review — T073

**Decision**: `NEEDS_AUTHORIZATION`  
**G1-OP readiness**: `NOT READY`  
**Reviewed by**: `orchestrator`

## Evidence

- Lock status: `INCOMPLETE_METADATA_ONLY_LOCK`.
- CPython 3.12.12 identified with 21,794,659 bytes and official digest `sha256:70ecfaf0bfc58298db11d6389be92c29ec4ef8cd93ebb6a7e54b41d9fc056b10`.
- 29 direct package candidates identified with compatible CPython 3.12/Windows wheel metadata.
- 74 transitive dependency names enumerated but not resolved into a conflict-checked exact lock.
- Three fail-closed results: the torch, torchvision and torchaudio XPU index entries point to `download-r2.pytorch.org`, outside the approved allowlist.
- Known direct transfer evidence: 217,675,195 bytes, excluding the three XPU wheels and unresolved transitives.
- 46 authorized GET metadata responses totaling 27,177,758 body bytes.
- Zero package, Python, source, model or dataset payloads downloaded.
- Zero environments or packages created or installed.

## Decision Rationale

No runtime incompatibility has been proved, so the state is not `BLOCKED`. G1-OP cannot be requested because the exact package set, the XPU wheel sizes, the complete conflict-checked transitive lock and the full download, cache and installed-disk impacts remain unknown.

## Next Request

Request `G1-METADATA-2`, limited to adding `download-r2.pytorch.org`, using HEAD for the three XPU wheel URLs, using GET only for indexes or PEP 658 metadata, and recursively resolving the 74 transitive requirements. The permitted output is a new versioned lock; the current lock must not be overwritten.

## Explicitly Prohibited

- Download of wheel, sdist, CPython, source repository, model or dataset payloads.
- Environment creation or package installation.
- Model or dataset retrieval and data preparation.
- Inference, baseline, dry validation or training.
- CPU, WSL, remote or paid fallback.

G1-OP remains closed.
