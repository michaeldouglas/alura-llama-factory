# Repository safety scan

**Date:** 2026-08-22  
**Scope:** tracked files outside `graphify-out/`, with a focused scan of `experiments/001-resource-efficient-finetune/`.

## Commands and summary

The scan checked tracked paths for generated model/checkpoint formats, cache or run directories, private-key markers and common secret assignments. It did not print source text, dataset rows or credential values.

| Check | Result |
|---|---:|
| Tracked non-Graphify files inspected | 138 |
| Tracked experiment files inspected | 84 |
| Versioned heavy-artifact path matches | 0 |
| Versioned model/checkpoint extensions | 0 |
| Secret/private-key pattern matches | 0 |
| Experiment outputs inside repository | 0 |

The Graphify cache is intentionally excluded from the heavy-artifact result because it is generated knowledge-graph metadata, not a model, dataset, checkpoint or training output. External model/cache/data/checkpoint paths are recorded only as identities in versioned manifests.

`git diff --check` reported no whitespace errors. Git emitted only the normal LF-to-CRLF working-copy warnings for existing Markdown files.

**Decision:** `PASS` — repository protection requirements are satisfied for the experiment.
