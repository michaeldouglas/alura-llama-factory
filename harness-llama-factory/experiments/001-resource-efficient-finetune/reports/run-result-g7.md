# G7 — Principal run result

**Decision: `FAILED` before the first training step**

The owner authorized exactly one execution of the frozen proposal
`001-resource-efficient-finetune-g7-proposal-20260822` with proposal hash
`0014e5bd1d577bcabf72278f72922919af21e9c49152716b48ab5ab7741c573f`.
The guarded runner validated G7, the model/dataset/configuration identities and the
external runtime, then launched LLaMA-Factory 0.9.5 exactly once.

## Preserved result

- Run manifest: `manifests/experiment-run.json`.
- External stdout/stderr: `%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/runs/g5-sft-lora-transformation-v1-20260822/logs/`.
- Status: `FAILED`; exit code: `1`; retry: prohibited by the run manifest.
- No optimizer update, training step or checkpoint was created.
- The external run directory is preserved and was not deleted or overwritten.

## Cause

The LLaMA-Factory dataset loader failed while creating its Windows file lock. The
explicit `cache_dir` from the frozen YAML caused `datasets` to construct a cache-lock
path longer than the Windows limit, producing `WinError 206` before the first batch.
The full traceback is preserved in the external stderr log.

## Next decision

Any correction must be treated as a material configuration/path change. It requires a
new reviewed execution proposal and a new exact owner authorization; this run is not
silently retried.
