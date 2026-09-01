# Graphify update

**Date:** 2026-08-22  
**Command:** `graphify update .`

The knowledge graph was refreshed after the pending test code was added. The update completed with:

- `698` nodes;
- `1,122` edges;
- `61` communities;
- AST extraction of `56/56` code files;
- refreshed `graph.json`, `graph.html` and `GRAPH_REPORT.md`.

The refreshed graph continues to connect the Spec Kit artifacts, gate manifests, dataset validation/preparation scripts, LLaMA-Factory compatibility validator, run guard and G8 evaluation. The Graphify cache remains generated project metadata and contains no model weights, source dataset rows or checkpoints.

**Decision:** `PASS` — relationships are refreshed and the experiment artifacts are represented in the current graph.
