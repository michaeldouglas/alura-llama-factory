# Runtime G2 Review

**Decision**: `READY_FOR_G2_OP_REVIEW`  
**Reviewed at**: `2026-08-22`  
**Prerequisite**: `G1-OP-V4` completed  
**Runtime evidence**: [runtime-g2-v2.json](runtime-g2-v2.json)

## Runtime evidence

- Python `3.12.12`, 64-bit CPython.
- PyTorch `2.9.1+xpu` and LLaMA-Factory `0.9.5` imported successfully.
- `uv pip check` passed for all 122 installed packages.
- XPU is available with one device: `Intel(R) Arc(TM) 140V GPU (16GB)`.
- Synthetic XPU operations passed: tensor creation, matrix multiplication, embedding,
  normalization, finite loss, backward pass, optimizer step and finite-value/gradient checks.
- CPU diagnostic also passed; CPU remains diagnostic only and was not selected as a fallback.
- The runtime environment is outside the repository at
  `%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/environments/py312-xpu`.

The first `runtime-g2.json` attempt is preserved as a technical failed attempt: PowerShell
argument quoting corrupted an inline Python probe. It did not retrieve any artifact. The corrected
file-backed probe produced the `READY` evidence in `runtime-g2-v2.json`.

## Proposed model payload — metadata only

The pinned model candidate remains `Qwen/Qwen2.5-0.5B-Instruct` at revision
`7ae557604adf67be50417f59c2c2f167def9a775`. The Hugging Face revision metadata reports ten files:

| File | Bytes | Payload class |
|---|---:|---|
| `model.safetensors` | 988,097,824 | model payload |
| Other nine files | 11,506,302 | configuration, tokenizer and license metadata |
| **Total exact retrieval estimate** | **999,604,126** | all revision files |

The model source is proposed under Apache-2.0 as documented in [research.md](../../../specs/001-resource-efficient-finetune/research.md).
The proposed non-versioned cache is:

`%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/cache/model/Qwen--Qwen2.5-0.5B-Instruct/7ae557604adf67be50417f59c2c2f167def9a775/`

Metadata was queried from the pinned Hugging Face revision only. No model file, tokenizer file or
dataset payload was downloaded, and no model was loaded.

## G2-OP request

The owner must separately approve all of the following before T027:

- exact model repository and revision above;
- Apache-2.0 license and intended local experimental use;
- exact maximum retrieval size of `999,604,126` bytes;
- the external cache path above and no-overwrite behavior;
- the approved Hugging Face metadata/payload endpoints used by the retrieval script.

Before that approval was recorded in `manifests/gates/g2-op.json`, model retrieval, tokenizer
retrieval, model loading, inference, dataset access and training remained blocked.

## G2-OP completion

The owner approved G2-OP on 2026-08-22. The ten approved files were retrieved and independently
verified in [model-source.json](../manifests/model-source.json): `999,604,126` bytes total, with
SHA-256 recorded for every file and the Apache-2.0 license marker verified. The model was not
loaded, and dataset retrieval, data preparation, inference and training remain unperformed.
