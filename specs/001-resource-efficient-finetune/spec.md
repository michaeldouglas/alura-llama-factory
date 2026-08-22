# Feature Specification: Resource-Efficient First Fine-Tuning Experiment

**Feature Branch**: `feature/harness` (repository branch); Spec Kit feature identifier: `001-resource-efficient-finetune`

**Created**: 2026-08-21

**Status**: Approved (Gate G0)

**Approved**: 2026-08-21 by the experiment owner; approval covers requirements only and does not authorize installation, artifact retrieval, or training.

**Input**: User description: "Quero fazer um fine-tuning com LLaMA-Factory. Como é apenas um primeiro experimento, quero usar um modelo pequeno e um dataset simples para que o treinamento seja rápido e consuma poucos recursos. Prepare e conduza o processo para mim."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review a Viable First Experiment (Priority: P1)

As the experiment owner, I want a small, clearly bounded fine-tuning proposal that teaches the model to classify short Portuguese texts as positive, neutral, or negative so that I can understand its objective, expected resource use, risks, and evidence before authorizing any execution.

**Why this priority**: A reviewed and viable proposal prevents an unsuitable model, dataset, or resource profile from reaching execution.

**Independent Test**: Present the proposal to the owner and verify that it identifies one learning objective, one candidate model source, one candidate dataset source, the planned data scope, the expected duration and resource envelope, the evaluation method, and every unresolved blocker.

**Acceptance Scenarios**:

1. **Given** the owner requested a fast, low-resource first experiment, **When** the proposal is prepared, **Then** it describes a single Portuguese sentiment-classification experiment with positive, neutral, and negative labels and explains how the choices support speed and low resource consumption.
2. **Given** the available hardware or runtime is not yet known, **When** the proposal is reviewed, **Then** it identifies the missing evidence and does not claim that training is ready.
3. **Given** the proposal has unresolved licensing, privacy, data-quality, or resource concerns, **When** readiness is assessed, **Then** the experiment remains blocked and the concerns are visible to the owner.

---

### User Story 2 - Validate a Simple Dataset Safely (Priority: P2)

As the experiment owner, I want the selected dataset to be inspected and validated without changing its source so that the training input is trustworthy, traceable, and appropriate for the experiment.

**Why this priority**: Data readiness is a mandatory prerequisite for any meaningful or safe training run.

**Independent Test**: Inspect the selected source and its separately prepared subset, then verify the validation report covers origin, license, schema, required fields, malformed records, duplicates, content quality, sensitive information, transformations, and a clear ready-or-blocked decision.

**Acceptance Scenarios**:

1. **Given** a dataset source has been selected, **When** it is validated, **Then** its original contents remain unchanged and every transformation is recorded against a separate derived artifact.
2. **Given** the dataset contains invalid, missing, duplicated, sensitive, or out-of-scope records, **When** validation completes, **Then** the report quantifies the findings and either justifies derived-data handling or blocks the experiment.
3. **Given** the dataset cannot be used under its license or usage conditions, **When** compliance is reviewed, **Then** training is blocked before any execution.

---

### User Story 3 - Authorize and Run the Bounded Experiment (Priority: P3)

As the experiment owner, I want to review the final execution proposal and explicitly authorize it so that only a validated, resource-compatible, reproducible experiment is run.

**Why this priority**: Execution consumes resources and produces artifacts; it must occur only after all prerequisite evidence has been accepted.

**Independent Test**: Verify that execution cannot begin until the requirements, data-readiness report, environment evidence, resource estimate, complete execution settings, output protections, and explicit owner authorization are all present.

**Acceptance Scenarios**:

1. **Given** the dataset is ready and the environment is compatible, **When** the final execution proposal is presented, **Then** it includes complete settings, expected duration and resource use, risks, output locations, stop conditions, and the planned evaluation.
2. **Given** one mandatory gate is missing or failed, **When** execution is requested, **Then** no training starts and the failed gate is reported.
3. **Given** all mandatory gates pass and the owner explicitly authorizes the run, **When** the experiment is conducted, **Then** it stays within the approved scope and preserves its records and outputs without overwriting earlier work.
4. **Given** a stop condition is reached during execution, **When** the run is halted, **Then** the reason and all available partial evidence are preserved.

---

### User Story 4 - Evaluate and Reproduce the Result (Priority: P4)

As the experiment owner, I want a concise before-and-after evaluation and a complete experiment record so that I can judge whether the first experiment was useful and decide the next step.

**Why this priority**: A completed run has little value without interpretable evidence and reproducibility.

**Independent Test**: Use the predefined evaluation set to compare the base and adapted behavior, then verify that another qualified person can reconstruct the experiment solely from the preserved record and approved artifact sources.

**Acceptance Scenarios**:

1. **Given** an authorized run completes, **When** evaluation is performed, **Then** the same predefined prompts or examples are applied before and after tuning and the outcomes are recorded without hiding regressions.
2. **Given** the experiment record is reviewed, **When** a reproduction is planned, **Then** model and dataset lineage, environment, settings, seed, hardware, logs, metrics, outputs, and deviations are all identifiable.

### Edge Cases

- The machine has no supported accelerator or has less usable memory than the selected experiment requires.
- The runtime version is unsupported by required training dependencies.
- A model or dataset source is inaccessible, changes revision, or has unclear licensing or usage restrictions.
- The selected dataset is empty after validation or preparation.
- Dataset records are malformed, inconsistent, duplicated, contaminated, sensitive, or unsuitable for the learning objective.
- The estimated duration, model size, execution location, or monetary cost exceeds the approved first-experiment resource envelope.
- The intended output location already contains an experiment with the same identity.
- The run is interrupted, exhausts memory, produces non-finite values, or exceeds an agreed stop condition.
- The run completes but the predefined evaluation shows no improvement or a regression.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The experiment MUST classify short Portuguese texts into exactly one of three labels—positive, neutral, or negative—and MUST use this same label definition for preparation, baseline evaluation, tuning, and final evaluation.
- **FR-002**: The process MUST propose exactly one small candidate model source and one simple candidate dataset source for the first run, including immutable revisions or equivalent source identifiers, intended use, licenses, and usage restrictions.
- **FR-003**: The proposal MUST use between 200 and 2,000 validated training records, state the final number and class distribution, and justify how that scope supports a fast, low-resource experiment.
- **FR-004**: The `dataset-specialist` MUST validate the selected dataset before any training decision and issue a report that declares it ready or blocked with quantified findings.
- **FR-005**: The original dataset MUST remain unchanged; filtering, cleaning, normalization, sampling, or conversion MUST produce separately identified derived data with documented lineage and transformations.
- **FR-006**: The process MUST inspect and record the actual execution environment and available hardware without inferring missing capabilities.
- **FR-007**: The `training-engineer` MUST estimate compatibility, peak resource demand, and expected duration using the validated dataset, selected model, and observed hardware before proposing final execution settings.
- **FR-008**: The final execution proposal MUST document all settings required to reproduce the run, including randomness controls, environment versions, input revisions, prompt and template, exact output-parsing rule, output destinations, evaluation inputs, and stop conditions.
- **FR-009**: The process MUST review model and dataset licenses, usage restrictions, privacy risks, and sensitive content before execution.
- **FR-010**: The process MUST prevent training until the specification is approved, the dataset is declared ready, the environment is compatible, the resource estimate is acceptable, the execution proposal is validated, and the owner gives explicit authorization.
- **FR-011**: An authorized run MUST remain within the approved model, dataset scope, settings, resource envelope, and output destinations. Changes to model or revision, dataset source or revision, data split, tuning method, randomness policy, evaluation policy, time or cost budget, or artifact destination are material and MUST return to the applicable review gate.
- **FR-012**: Existing configurations, datasets, logs, metrics, checkpoints, and results MUST NOT be overwritten.
- **FR-013**: The process MUST preserve the run status, settings, environment, logs, metrics, outputs, interruptions, deviations, and failures needed for audit and reproduction.
- **FR-014**: The process MUST compare the result against the unchanged base behavior using the same reserved, stratified Portuguese evaluation set containing at least 30 records per class. The set MUST have zero exact or normalized overlap with training data; near-duplicates MUST be quantified and reviewed. The comparison MUST report accuracy, macro-averaged F1, invalid-label rate, improvements, and regressions.
- **FR-015**: The process MUST conclude with a clear outcome of successful experiment, unsuccessful experiment, or blocked experiment, together with evidence and a recommended next decision.
- **FR-016**: LLaMA-Factory MUST be the canonical interface for supported configuration, tuning, evaluation, inference, and export activities in this experiment.
- **FR-017**: The prepared dataset schema and final execution settings MUST be validated against the selected revisions and versions of the model and LLaMA-Factory before execution.
- **FR-018**: Secrets, credentials, private data, model weights, caches, and generated checkpoints MUST NOT be added to version control; their approved non-versioned locations MUST be documented before retrieval or generation.
- **FR-019**: The prompt, template, label definitions, parsing rule, evaluation set, and scoring procedure MUST be frozen before recording the unchanged base result and MUST remain unchanged for final evaluation.
- **FR-020**: The experiment MUST run only on the confirmed local machine, incur no external-compute charge, use a base model with no more than 1.5 billion parameters, and limit the authorized principal training run to 60 minutes of elapsed time. If these limits are not feasible, the experiment MUST be reported as blocked rather than moved to paid or remote compute.

### Classification Policy

- The accepted inputs are primarily Portuguese texts of no more than 280 Unicode characters that express or may express sentiment toward one principal subject.
- `positivo` applies when favorable sentiment toward the principal subject predominates.
- `negativo` applies when unfavorable sentiment toward the principal subject predominates.
- `neutro` applies when no clear sentiment predominates, including factual, balanced, mixed, ambiguous, or non-interpretable ironic text.
- Text without a principal subject, text that cannot be interpreted reliably, and text not primarily in Portuguese are outside the prepared training and evaluation scope.
- A valid prediction is, after trimming surrounding whitespace and converting letter case, exactly one of `positivo`, `neutro`, or `negativo`. Any explanation, additional text, multiple labels, or different value is invalid.

### Key Entities

- **Experiment Specification**: The approved learning objective, scope, acceptance evidence, constraints, and exclusions for the first experiment.
- **Model Source**: The selected base artifact, immutable identity, provenance, intended use, license, and usage restrictions.
- **Dataset Source**: The immutable original data, provenance, schema, license, usage restrictions, and validation observations.
- **Prepared Dataset**: A separate, traceable training input derived from the dataset source, including every transformation and validation result.
- **Environment Profile**: Observed runtime, dependency, compute, memory, storage, and accelerator capabilities used to assess feasibility.
- **Execution Proposal**: The complete reproducible settings, estimates, risks, output destinations, stop conditions, and approval state for a potential run.
- **Experiment Run**: An authorized execution and its identity, status, timestamps, logs, metrics, deviations, failures, and generated outputs.
- **Evaluation Record**: The predefined examples, unchanged base responses, adapted responses, comparison criteria, findings, and conclusion.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Before execution, 100% of mandatory gates have dated evidence and an explicit pass decision; any missing or failed gate results in zero training steps executed.
- **SC-002**: The selected training input has 100% schema-valid records, zero unresolved sensitive-data findings, documented lineage for every derived transformation, and an explicit ready decision from the data owner.
- **SC-003**: The principal training run uses only the confirmed local machine, incurs R$ 0 in external-compute charges, uses a base model of at most 1.5 billion parameters, and either completes within 60 elapsed minutes or stops with the reason preserved.
- **SC-004**: No pre-existing dataset, configuration, log, metric, checkpoint, or result is modified or overwritten during preparation, execution, or evaluation.
- **SC-005**: 100% of the frozen, stratified evaluation examples are run against both the unchanged base behavior and the experiment result, with all observed improvements, neutral outcomes, and regressions recorded.
- **SC-006**: The final record contains every item needed to identify the input revisions, environment, hardware, settings, randomness controls, outputs, and observed results, with zero undocumented material deviations.
- **SC-007**: At completion, the owner receives one unambiguous status—successful, unsuccessful, or blocked—and enough evidence to approve or reject a next experiment without repeating discovery work.
- **SC-008**: A completed experiment is classified as successful only if the adapted result produces one valid sentiment label for 100% of the reserved examples and meets the applicable comparison rule: when the unchanged base macro-F1 is below 0.80, the adapted macro-F1 is at least 0.10 higher; when the unchanged base macro-F1 is 0.80 or higher, the adapted macro-F1 is at least 0.02 higher and its accuracy is not lower. Otherwise, the experiment is reported as unsuccessful without hiding the measurements.

## Assumptions

- The first experiment is exploratory supervised tuning for Portuguese sentiment classification, intended to validate the end-to-end process rather than produce a production-ready model.
- A small, public, non-sensitive dataset or subset with acceptable usage terms is preferred; no private user data is required.
- The exact model, dataset, and subset size are planning decisions to be researched and approved after this specification, within the resource envelope selected by the owner.
- Internet access may be required to inspect and retrieve approved public artifacts, but no source is trusted without provenance and license review.
- If no compatible accelerator is available, the process may select an even smaller viable experiment or remain blocked; it will not invent hardware capability.
- Publishing, serving, merging, exporting, or distributing model weights is outside the scope of this first experiment.
- Installation or environment changes are performed only after the technical plan identifies supported versions and the owner approves the resulting impact.
- The project Constitution and its ordered specialist-review gates govern the process from preparation through evaluation.

## Plain-Language Terms

- **Unchanged base result (baseline)**: The model's performance before any tuning; it is the reference used to determine whether tuning helped.
- **Accuracy**: The proportion of reserved examples assigned the correct sentiment label.
- **Macro-F1**: The average classification-quality score across the three labels, giving each label equal importance even when their record counts differ.
- **Schema**: The required structure and fields of each dataset record.
- **Revision**: An immutable or precisely identified version of a model or dataset source.
- **Prompt and template**: The fixed instructions and text arrangement used to ask the model for a sentiment label.
- **Checkpoint**: A saved training state or generated tuning artifact that can consume substantial storage and must remain outside version control.
