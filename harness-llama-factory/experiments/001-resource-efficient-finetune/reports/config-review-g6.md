# G6 — Configuration and governance review

**Decision: `READY_FOR_DRY_VALIDATION`**

This is the orchestrator's prerequisite review for one representative microbatch. It does not
authorize the principal training run, inference, baseline, or checkpoint creation.

## Reviewed identity

- Model: `Qwen/Qwen2.5-0.5B-Instruct`, revision `7ae557604adf67be50417f59c2c2f167def9a775`.
- Dataset object: `transformation-v1`, gate `G4-DERIVED = DATA_READY`; original G4 source remains `DATA_BLOCKED`.
- Method: SFT + LoRA, proposal-only YAML.
- Runtime: external CPython 3.12.12, PyTorch `2.9.1+xpu`, LLaMA-Factory `0.9.5`, one XPU.
- Compatibility evidence: `READY`; no model weights were deserialized and no forward/backward was executed.

## Review checks

- License: model Apache-2.0; source dataset CC BY 3.0 with applicable X/Twitter restrictions preserved.
- Privacy: direct phone indicator was redacted in the derived candidate; handles were redacted; sensitive and non-Portuguese heuristic records were excluded with lineage reasons.
- Data integrity: derived schema, counts, split isolation, hashes and lineage passed the G4-DERIVED review.
- Configuration: YAML parses under the installed runtime; model, tokenizer, Qwen template and Alpaca converter checks passed.
- External storage: model, dataset, output, logs and future checkpoints are outside the repository.
- No-overwrite: proposed output path does not exist; `overwrite_output_dir: false`; prior artifacts are not targeted.
- Cost: local-only execution, no paid or remote compute proposed.
- Resource envelope: projected 25–50 minutes with a hard 60-minute stop condition; peak memory estimate 8–12 GiB shared XPU memory remains an estimate until dry validation.
- Parser adjustment: unsupported `save_safetensors` was removed from the YAML after the LLaMA-Factory parser rejected it; the format policy remains explicit for later review.
- Constitution: training remains blocked until dry-validation evidence, a frozen execution proposal and explicit G7 authorization exist.

## Hashes reviewed

| Artifact | SHA-256 |
|---|---|
| `configs/sft-lora-proposal.yaml` | `e15d06916a16dab34e4c524b550c57798f7876c41fa3ca651b7256bf2edfa7c8` |
| `reports/compatibility-g5.json` | `5dd888061ea4b26aaf882300a226d9c7339faed1069963bf75eba7b8ce9a7ae0` |
| `manifests/model-source.json` | `104c7f3e32eda38d55e9bc1848a727037588016f037d22e31b531f7416555b5c` |
| `manifests/dataset-info.json` | `5622f6d24c631abfa3ccfd42d6c2598ca73a741f330083faed5a7a310972b5c6` |
| `manifests/gates/g4-derived.json` | `68c57cc1d357412096390e622addb4b359455b5d2a7f535075d742a61694b2f1` |
| `reports/runtime-g2-v2.json` | `a566e7ed517369dc37b3a5626dfb87572e4c08cbb3c8bd0d24778779d6c0c5ba` |

## Authorization boundary

The only next authorized action from this review is the training-engineer's representative
microbatch/frozen-baseline validation under T052/T053. It must not create an optimizer update,
checkpoint or principal run. Any OOM, non-finite value, CPU fallback, output collision, schema
divergence or duration projection above 60 minutes changes this decision to `BLOCKED` and must be
preserved as evidence.
