# G8 — Final evaluation

**Decision: `SUCCESSFUL`**

The v3 principal run completed successfully in 39 minutes and 27 seconds within the
60-minute hard stop. The final adapter checkpoint is preserved outside the repository
at `checkpoint-448`; its file hashes are recorded in `reports/evaluation-g8.json`.

## Frozen comparison

The unchanged base and adapted model were evaluated with the identical deterministic
90-record subset, containing 30 records per class, prompt, Qwen template, greedy
generation (`do_sample=false`, `num_beams=1`, `max_new_tokens=4`) and exact-label parser.

| Model | Accuracy | Macro-F1 | Invalid-label rate |
|---|---:|---:|---:|
| Base | 0.5000 | 0.4044 | 1.11% |
| LoRA adapter | 0.6889 | 0.6891 | 0.00% |

Macro-F1 improved by **0.2847**, exceeding the required **0.10** improvement because
the base macro-F1 was below 0.80. The adapted model also produced valid labels for
100% of the frozen examples and improved accuracy by 0.1889.

## Reproducibility and scope

- Run manifest: `manifests/experiment-run-v3.json`.
- Evaluation record: `manifests/evaluation-record.json`.
- Detailed evaluation: `reports/evaluation-g8.json`.
- Model, dataset revision, transformation, selection hash and checkpoint hashes are
  preserved in the detailed evaluation record.
- No repository copy of the model weights, dataset or adapter checkpoint was created.

Under SC-008 and the frozen evaluation policy, the first experiment is classified as
`SUCCESSFUL`.
