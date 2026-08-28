from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest


SCRIPT_DIR = Path(__file__).parents[1] / "scripts"


def load_module(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPT_DIR / filename)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


validator = load_module("escutia_validator", "validate_escutia_integration.py")
sys.modules["validate_escutia_integration"] = validator
renderer = load_module("escutia_renderer", "render_escutia_config.py")


def test_default_escutia_preflight_is_ready():
    profile = validator.load_profile()
    root = validator.resolve_project_root(None, profile)
    result = validator.validate(profile, root)

    assert result["status"] == "READY"
    assert result["project_name"] == "EscutIA"
    assert result["read_only_target"] is True
    assert result["dataset"]["splits"]["train"]["records"] == 1833
    assert result["dataset"]["splits"]["validation"]["records"] == 612
    assert result["dataset"]["splits"]["evaluation"]["records"] == 612
    assert result["execution"]["training_started"] is False
    assert result["execution"]["training_authorized_by_preflight"] is False


def test_preflight_rejects_escutai_typo(tmp_path):
    profile = validator.load_profile()
    wrong = tmp_path / "EscutAI"
    wrong.mkdir()
    with pytest.raises(validator.IntegrationError, match="EscutAI"):
        validator.resolve_project_root(str(wrong), profile)


def test_rendered_config_uses_existing_dataset_and_external_output():
    profile = validator.load_profile()
    root = validator.resolve_project_root(None, profile)
    rendered = renderer.render(profile, root)

    assert f"dataset_dir: '{root / 'dataset' / 'dados' / 'preparados'}'" in rendered
    assert "dataset: 'escutia_treino'" in rendered
    assert "eval_dataset: 'escutia_validacao'" in rendered
    assert "do_train: true" in rendered
    assert "escutia-integration" in rendered
    assert str(root) not in rendered.split("output_dir:", 1)[1]
