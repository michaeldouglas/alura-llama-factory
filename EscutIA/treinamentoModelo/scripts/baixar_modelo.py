"""Baixa o modelo base fixado pelo curso para a pasta local do projeto."""

from __future__ import annotations

from pathlib import Path

from huggingface_hub import snapshot_download


ROOT = Path(__file__).resolve().parents[1]
MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct"
REVISION = "7ae557604adf67be50417f59c2c2f167def9a775"
MODEL_DIR = ROOT / "models" / "Qwen--Qwen2.5-0.5B-Instruct"


def main() -> int:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Baixando {MODEL_ID} na revisão {REVISION}...")
    snapshot_download(
        repo_id=MODEL_ID,
        revision=REVISION,
        local_dir=str(MODEL_DIR),
    )
    required = ("config.json", "tokenizer.json", "tokenizer_config.json")
    missing = [name for name in required if not (MODEL_DIR / name).is_file()]
    if missing:
        raise SystemExit(f"Download incompleto; arquivos ausentes: {', '.join(missing)}")
    print(f"Modelo pronto em: {MODEL_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
