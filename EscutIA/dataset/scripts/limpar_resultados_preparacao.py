"""Remove apenas resultados gerados da preparação do dataset do EscutIA.

As fontes, o notebook, os scripts e a documentação ficam preservados.
Use este utilitário para voltar ao estado de primeira execução da Parte 2.
"""

from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FILES = [
    ROOT / "dados" / "dataset.csv",
    ROOT / "dados" / "revisao_manual.json",
    ROOT / "dados" / "revisao_manual.template.json",
    ROOT / "dados" / "dataset_info.json",
    ROOT / "dados" / "manifesto_dataset.json",
    ROOT / "dados" / "avaliacao_congelada.jsonl",
    ROOT / "dados" / "README.md",
]
DIRECTORIES = [
    ROOT / "dados" / "preparados",
    ROOT / "dados" / "trabalho",
    ROOT / "dados" / "relatorios",
]


def assert_inside_root(path: Path) -> None:
    try:
        path.resolve().relative_to(ROOT.resolve())
    except ValueError as error:
        raise RuntimeError(f"Alvo fora de EscutIA/dataset: {path}") from error


def main() -> None:
    for path in FILES + DIRECTORIES:
        assert_inside_root(path)

    for path in FILES:
        if path.is_file():
            path.unlink()

    for directory in DIRECTORIES:
        if not directory.is_dir():
            continue
        for child in directory.iterdir():
            if child.name == ".gitkeep":
                continue
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()

    print("Resultados da preparação removidos; fontes e código preservados.")


if __name__ == "__main__":
    main()
