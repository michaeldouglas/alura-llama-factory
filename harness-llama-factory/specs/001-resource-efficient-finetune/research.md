# Research: Resource-Efficient First Fine-Tuning Experiment

**Date**: 2026-08-21

**Status**: Complete and accepted at Gate G0-B on 2026-08-21 for planning and provisional source selection only. Remaining uncertainty is represented by empirical execution gates, not unresolved requirements.

## Decision 1 — Base model candidate

**Decision**: Propose `Qwen/Qwen2.5-0.5B-Instruct` at immutable revision `7ae557604adf67be50417f59c2c2f167def9a775`.

**Rationale**:

- The official model card reports 0.49B parameters, within the approved 1.5B limit.
- The card explicitly lists Portuguese among more than 29 supported languages.
- The weights are Apache-2.0 and the repository is public and ungated.
- Qwen2.5-Instruct is listed as supported by LlamaFactory.
- Its approximately 1 GB BF16 weight file leaves substantially more shared memory headroom than a 1B–1.5B alternative.

**Alternatives considered**:

- `google/gemma-3-1b-it`: multilingual and within the size limit, but about twice as large, gated and governed by Gemma-specific terms. Rejected for the first low-friction experiment.
- Newer Qwen reasoning families: not selected because thinking/output behavior adds avoidable parsing and template complexity to a three-label task.

**Risks and gates**:

- Portuguese quality must be measured with the frozen baseline.
- The selected template must terminate after one label; no custom special label tokens will be added.
- File identities and hashes must be recorded after an approved retrieval.

**Primary sources**:

- https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct
- https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/tree/7ae557604adf67be50417f59c2c2f167def9a775
- https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/blob/7ae557604adf67be50417f59c2c2f167def9a775/LICENSE
- https://github.com/hiyouga/LlamaFactory/releases

## Decision 2 — Dataset candidate

**Decision**: Propose the `portuguese` configuration of `cardiffnlp/tweet_sentiment_multilingual` at immutable repository commit `606156db529f327fd871515cccbe14dcbafef682`, the official commit that introduced the Portuguese source files.

**Rationale**:

- It natively represents `negative`, `neutral` and `positive` as labels 0, 1 and 2.
- Official current statistics report 1,839 balanced training records, 324 balanced validation records and 870 balanced test records.
- Maximum Portuguese text lengths reported for the three splits are below 280 characters.
- Original splits can be preserved: train for preparation/training, validation for development checks and test for the frozen final comparison.
- The source is only a few megabytes and does not require relabeling or synthetic generation.

**Alternatives considered**:

- B2W-Reviews01: rejected because it needs a derived three-class policy, resplitting, length filtering, broader privacy review and reconciliation of conflicting license metadata.
- Synthetic customer-service conversations: rejected because the records are multi-turn and typically exceed the approved 280-character single-text scope.

**Risks and gates**:

- The card declares CC BY 3.0 and additionally requires compliance with X/Twitter terms. Owner acceptance is mandatory before retrieval.
- Human-authored posts may retain personal or sensitive content despite `@user` and URL normalization.
- The card's split counts differ by one record from the current dataset service. The `dataset-specialist` must calculate counts and hashes from the pinned bytes rather than trust metadata.
- Exact, normalized and near-duplicate contamination must be checked across all splits.

**Primary sources**:

- https://huggingface.co/datasets/cardiffnlp/tweet_sentiment_multilingual
- https://huggingface.co/datasets/cardiffnlp/tweet_sentiment_multilingual/commit/606156db529f327fd871515cccbe14dcbafef682
- https://datasets-server.huggingface.co/statistics?dataset=cardiffnlp%2Ftweet_sentiment_multilingual&config=portuguese&split=train
- https://datasets-server.huggingface.co/statistics?dataset=cardiffnlp%2Ftweet_sentiment_multilingual&config=portuguese&split=validation
- https://datasets-server.huggingface.co/statistics?dataset=cardiffnlp%2Ftweet_sentiment_multilingual&config=portuguese&split=test
- https://github.com/cardiffnlp/xlm-t
- https://aclanthology.org/2022.lrec-1.27/

## Decision 3 — LlamaFactory revision

**Decision**: Pin LlamaFactory v0.9.5, commit `7af909522a951e3ad9f022ea6f88b6755257eaa5`, for this experiment.

**Rationale**:

- It is an immutable stable release rather than a moving main branch.
- It recognizes XPU devices in runtime selection and memory utilities.
- Its package metadata defines bounded versions for Transformers, Datasets, Accelerate, PEFT and TRL.
- It officially supports the Qwen2.5 family and the required Alpaca-style SFT schema.

**Alternatives considered**:

- Current main: rejected because moving dependencies and code would weaken reproducibility.
- Older releases: rejected because current XPU and dependency support is less favorable.

**Primary sources**:

- https://github.com/hiyouga/LlamaFactory/releases/tag/v0.9.5
- https://github.com/hiyouga/LlamaFactory/blob/v0.9.5/pyproject.toml
- https://github.com/hiyouga/LlamaFactory/blob/v0.9.5/src/llamafactory/extras/misc.py
- https://github.com/hiyouga/LlamaFactory/blob/v0.9.5/data/README.md

## Decision 4 — Python and dependency runtime

**Decision**: Create a new isolated CPython 3.12 x64 training environment after approval. Propose the matched stable XPU trio `torch==2.9.1`, `torchvision==0.24.1`, `torchaudio==2.9.1`; resolve and lock all transitive dependencies before installation is accepted as ready.

**Rationale**:

- LlamaFactory v0.9.5 publishes classifiers for Python 3.11–3.13, not the repository's current Python 3.14.
- Python 3.12 has broad binary-package coverage and official Windows XPU wheels for the proposed trio.
- The official XPU index contains matching CPython 3.12 Windows wheels, avoiding a source build.
- A separate environment preserves the current harness and makes rollback simple.

**Alternatives considered**:

- Reuse Python 3.14 `.venv`: rejected because it is outside LlamaFactory's published tested classifiers and currently lacks even a package installer and training dependencies.
- Python 3.13: viable fallback if the complete resolution is cleaner, but offers no advantage for this experiment.
- Nightly wheels: rejected because the experiment requires stable, reproducible dependencies.

**Primary sources**:

- https://github.com/hiyouga/LlamaFactory/blob/v0.9.5/pyproject.toml
- https://pytorch.org/get-started/previous-versions/
- https://download.pytorch.org/whl/xpu/
- https://docs.astral.sh/uv/pip/

## Decision 5 — Hardware execution route

**Decision**: Treat native Windows XPU as the only candidate principal-run route in this plan. Treat CPU as a separate diagnostic route, never an automatic fallback.

**Rationale**:

- PyTorch officially lists Windows 11 and Lunar Lake/Core Ultra Series 2 with Intel Arc graphics as supported XPU hardware.
- PyTorch documents training, inference, FP32, BF16, FP16 and AMP on XPU.
- LlamaFactory v0.9.5 detects XPU, but there is no upstream end-to-end proof for this exact Windows/Arc combination, so synthetic and real-microbatch gates remain mandatory.
- CPU may function but has no evidence of completing the approved workload within 60 minutes.

**Alternatives considered**:

- WSL2 XPU: local but omitted from this plan because enabling it changes the approved environment approach; reconsider only through a plan update.
- CUDA/QLoRA: unavailable because no NVIDIA device exists; bitsandbytes support for this integrated Arc model is not assumed.
- Remote GPU: prohibited by the approved R$ 0 local-only constraint.

**Primary sources**:

- https://docs.pytorch.org/docs/main/notes/get_start_xpu.html
- https://github.com/hiyouga/LlamaFactory/blob/v0.9.5/src/llamafactory/extras/misc.py
- https://github.com/hiyouga/LlamaFactory/issues/8982

## Decision 6 — Data preparation format

**Decision**: Preserve source files unchanged and create a derived UTF-8 JSONL dataset in LlamaFactory Alpaca SFT format:

```json
{"instruction":"Classifique o sentimento do texto em exatamente uma palavra: positivo, neutro ou negativo.","input":"<texto-fonte>","output":"<rótulo-português>"}
```

The numeric mapping is `0→negativo`, `1→neutro`, `2→positivo`. Source revision, split, row identity, source hash, normalized hash and transformation version are stored in a sidecar lineage manifest, not in the learned text.

**Rationale**:

- LlamaFactory documents `instruction`, optional `input` and `output` as its simple supervised format.
- Exact one-word outputs match the approved parser and reduce generation cost.
- A sidecar keeps provenance without teaching metadata to the model.

**Alternatives considered**:

- ShareGPT/OpenAI messages: valid but unnecessarily complex for single-turn classification.
- Direct hub loading without a derivative: rejected because it would not preserve the required transformation lineage or frozen prompt.

**Primary source**: https://github.com/hiyouga/LlamaFactory/blob/v0.9.5/data/README.md

## Decision 7 — Evaluation design

**Decision**: Preserve the source validation split for development checks and freeze the complete source test split for baseline and final evaluation, subject to data validation. Use the same prompt, template, generation limits, parser and ordering for both model states.

**Rationale**:

- The current test split is balanced and comfortably exceeds 30 records per class.
- Retaining original splits avoids arbitrary resplitting and simplifies leakage checks.
- Accuracy, macro-F1 and invalid-label rate directly implement FR-014 and SC-008.

**Alternatives considered**:

- A sampled 90-record evaluation: cheaper but statistically weaker and unnecessary for short one-label generations unless timing tests prove the complete set violates the budget. Any reduction would be a reviewed material change.

## Decision 8 — Provisional fine-tuning direction

**Decision**: Reserve SFT with LoRA as the provisional direction; do not create the final YAML or hyperparameters during planning.

**Rationale**:

- LoRA limits trainable parameters and avoids unsupported quantization assumptions.
- The Constitution requires the `training-engineer` to use the validated dataset and measured hardware before choosing rank, target modules, precision, sequence length, batch size, accumulation, learning rate, epochs or checkpoint cadence.

**Alternatives considered**:

- Full fine-tuning: rejected as inconsistent with the low-resource objective.
- QLoRA: not selected because the Intel Arc/bitsandbytes path is not established for this machine.

## Decision 9 — Wheel-only OmegaConf remediation

**Decision**: Evaluate `omegaconf==2.0.6` as an experiment-level dependency override in a new
metadata-only lock, while preserving the LLaMA-Factory v0.9.5 source revision and the previous
blocked lock.

**Rationale**:

- The unpinned latest OmegaConf candidate selected by the first recursive resolver introduced
  `antlr4-python3-runtime==4.9.*`, for which no CPython 3.12/Windows wheel was available.
- The owner explicitly authorized this narrow remediation on 2026-08-22.
- The candidate exposes a universal wheel and does not introduce the blocked `antlr4` dependency
  in official package metadata; installed runtime behavior remains an empirical G2 question.

**Alternatives considered**:

- Install the `antlr4` source distribution: rejected because source builds are prohibited by the
  current runtime policy.
- Change Python, use CPU, WSL2, or remote compute: rejected because each would materially change
  the approved experiment scope or violate the local-only resource policy.

## Research Conclusion

No implementation ambiguity remains for the metadata remediation. The owner accepted the selected model
and dataset as **provisional candidates** at Gate G0-B and authorized only the new wheel-only dependency
review described in Decision 9. This decision does not accept the dataset terms for retrieval and does
not authorize any operational action. The next transition after a successful lock review is a separate
G1-OP authorization request. Data retrieval, model retrieval, environment installation, preparation,
dry validation and training remain unauthorized.
