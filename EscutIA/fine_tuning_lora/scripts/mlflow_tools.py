r"""Ferramentas de rastreabilidade do experimento LoRA no MLflow.

Uso a partir da raiz do repositório:

    .venv\Scripts\python.exe EscutIA\fine_tuning_lora\scripts\mlflow_tools.py log
    .venv\Scripts\python.exe EscutIA\fine_tuning_lora\scripts\mlflow_tools.py compare
    .venv\Scripts\python.exe EscutIA\fine_tuning_lora\scripts\mlflow_tools.py register

O script não inicia treinamento. Ele registra artefatos do adapter já gerado,
compara execuções e cria versões no Model Registry quando solicitado.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
from pathlib import Path
from typing import Any

from mlflow.exceptions import MlflowException
from mlflow.tracking import MlflowClient


BASE_DIR = Path(__file__).resolve().parents[1]
DATASET_DIR = BASE_DIR.parent / "dataset" / "dados" / "preparados"
OUTPUT_DIR = BASE_DIR / "outputs" / "resultados" / "lora_escutia_router"
CONFIG_PATH = BASE_DIR / "configs" / "lora_escutia.yaml"
GATE_PATH = BASE_DIR.parent / "dataset" / "dados" / "relatorios" / "11_validacao_final.json"
MANIFEST_PATH = BASE_DIR.parent / "dataset" / "manifesto_dataset.json"
MLFLOW_DB_PATH = BASE_DIR.parent / "mlflow.db"
EXPERIMENT_NAME = "escutia-lora"
DEFAULT_MODEL_NAME = "EscutIA-LoRA"


def tracking_uri() -> str:
    return f"sqlite:///{str(MLFLOW_DB_PATH).replace(chr(92), '/')}"


def client() -> MlflowClient:
    return MlflowClient(tracking_uri=tracking_uri())


def experiment_id(mlflow_client: MlflowClient) -> str:
    experiment = mlflow_client.get_experiment_by_name(EXPERIMENT_NAME)
    if experiment is None:
        raise RuntimeError(
            f"Experimento {EXPERIMENT_NAME!r} não encontrado. Execute primeiro o treinamento."
        )
    return experiment.experiment_id


def latest_training_run(mlflow_client: MlflowClient, run_id: str | None = None):
    if run_id:
        return mlflow_client.get_run(run_id)
    runs = mlflow_client.search_runs(
        [experiment_id(mlflow_client)],
        filter_string="tags.mlflow.runName = 'lora_escutia_router'",
        order_by=["start_time DESC"],
        max_results=1,
    )
    if not runs:
        raise RuntimeError("Nenhuma execução lora_escutia_router foi encontrada.")
    return runs[0]


def dataset_hash() -> str:
    files = [
        DATASET_DIR / "dataset_info.json",
        DATASET_DIR / "escutia_train.json",
        DATASET_DIR / "escutia_validation.json",
        DATASET_DIR / "escutia_evaluation.json",
    ]
    digest = hashlib.sha256()
    for path in files:
        if not path.exists():
            continue
        digest.update(path.name.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    value = json.loads(path.read_text(encoding="utf-8"))
    return value if isinstance(value, dict) else {}


def numeric_values(*payloads: dict[str, Any]) -> dict[str, float]:
    values: dict[str, float] = {}
    for payload in payloads:
        for key, value in payload.items():
            if isinstance(value, bool):
                continue
            try:
                values[key] = float(value)
            except (TypeError, ValueError):
                continue
    return values


def log_current_run(run_id: str | None = None) -> str:
    mlflow_client = client()
    run = latest_training_run(mlflow_client, run_id)
    actual_run_id = run.info.run_id

    train_results = read_json(OUTPUT_DIR / "train_results.json")
    eval_results = read_json(OUTPUT_DIR / "eval_results.json")
    all_results = read_json(OUTPUT_DIR / "all_results.json")
    metrics = numeric_values(train_results, eval_results, all_results)
    for name, value in metrics.items():
        mlflow_client.log_metric(actual_run_id, name, value)

    params = {
        "dataset_hash_sha256": dataset_hash(),
        "model_base": "Qwen/Qwen2.5-0.5B-Instruct",
        "fine_tuning_method": "lora",
        "training_stage": "sft",
        "hardware_platform": platform.platform(),
    }
    for name, value in params.items():
        mlflow_client.log_param(actual_run_id, name, str(value))

    tags = {
        "artifact_type": "lora_adapter",
        "dataset_gate": read_json(GATE_PATH).get("decisao", "não encontrado"),
        "model_base": "Qwen/Qwen2.5-0.5B-Instruct",
        "evaluation_ready": str((OUTPUT_DIR / "eval_results.json").exists()).lower(),
    }
    for name, value in tags.items():
        mlflow_client.set_tag(actual_run_id, name, str(value))

    context_artifacts = [CONFIG_PATH, GATE_PATH, MANIFEST_PATH, OUTPUT_DIR / "trainer_log.jsonl"]
    adapter_artifacts = [
        OUTPUT_DIR / "adapter_model.safetensors",
        OUTPUT_DIR / "adapter_config.json",
        OUTPUT_DIR / "tokenizer.json",
        OUTPUT_DIR / "tokenizer_config.json",
        OUTPUT_DIR / "train_results.json",
        OUTPUT_DIR / "eval_results.json",
        OUTPUT_DIR / "all_results.json",
        OUTPUT_DIR / "trainer_state.json",
    ]
    for path in context_artifacts:
        if path.exists():
            mlflow_client.log_artifact(actual_run_id, str(path), artifact_path="contexto_treinamento")
    for path in adapter_artifacts:
        if path.exists():
            mlflow_client.log_artifact(actual_run_id, str(path), artifact_path="adapter_lora")

    print(f"Execução enriquecida: {actual_run_id}")
    print(f"Artefatos do adapter registrados: {sum(path.exists() for path in adapter_artifacts)}")
    return actual_run_id


def compare_runs() -> None:
    mlflow_client = client()
    runs = mlflow_client.search_runs(
        [experiment_id(mlflow_client)],
        filter_string="tags.mlflow.runName = 'lora_escutia_router'",
        order_by=["metrics.eval_loss ASC", "start_time DESC"],
        max_results=100,
    )
    columns = ["run_id", "status", "eval_loss", "loss", "learning_rate", "epoch", "start_time"]
    print("\t".join(columns))
    for run in runs:
        row = {
            "run_id": run.info.run_id,
            "status": run.info.status,
            "eval_loss": run.data.metrics.get("eval_loss", ""),
            "loss": run.data.metrics.get("loss", ""),
            "learning_rate": run.data.metrics.get("learning_rate", ""),
            "epoch": run.data.metrics.get("epoch", ""),
            "start_time": run.info.start_time,
        }
        print("\t".join(str(row[column]) for column in columns))


def register_adapter(run_id: str | None = None, model_name: str = DEFAULT_MODEL_NAME) -> None:
    mlflow_client = client()
    run = latest_training_run(mlflow_client, run_id)
    actual_run_id = run.info.run_id
    adapter_path = OUTPUT_DIR / "adapter_model.safetensors"
    if not adapter_path.exists():
        raise FileNotFoundError(f"Adapter não encontrado: {adapter_path}")

    try:
        mlflow_client.get_registered_model(model_name)
    except MlflowException:
        mlflow_client.create_registered_model(
            model_name,
            description="Adapter LoRA do roteador de sentimentos do EscutIA.",
        )

    versoes_existentes = mlflow_client.search_model_versions(f"name='{model_name}'")
    for versao_existente in versoes_existentes:
        if versao_existente.run_id == actual_run_id:
            print(
                f"Modelo já registrado: {model_name} versão {versao_existente.version} "
                f"(run {actual_run_id})"
            )
            return

    version = mlflow_client.create_model_version(
        name=model_name,
        source=f"runs:/{actual_run_id}/adapter_lora",
        run_id=actual_run_id,
        description="Adapter LoRA registrado após treinamento e avaliação.",
    )
    mlflow_client.set_model_version_tag(model_name, version.version, "artifact_type", "lora_adapter")
    mlflow_client.set_model_version_tag(model_name, version.version, "base_model", "Qwen/Qwen2.5-0.5B-Instruct")
    print(f"Modelo registrado: {model_name} versão {version.version} (run {actual_run_id})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    for command in ("log", "register"):
        subparser = subparsers.add_parser(command)
        subparser.add_argument("--run-id")
        if command == "register":
            subparser.add_argument("--model-name", default=DEFAULT_MODEL_NAME)
    subparsers.add_parser("compare")

    args = parser.parse_args()
    if args.command == "log":
        log_current_run(args.run_id)
    elif args.command == "compare":
        compare_runs()
    elif args.command == "register":
        register_adapter(args.run_id, args.model_name)


if __name__ == "__main__":
    main()
