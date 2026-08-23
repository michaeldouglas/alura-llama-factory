from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_evaluator():
    path = ROOT / "scripts" / "evaluate_frozen_set.py"
    spec = importlib.util.spec_from_file_location("evaluate_frozen_set_compatibility", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class LlamaFactoryCompatibilityTests(unittest.TestCase):
    def test_registered_dataset_names_template_and_alpaca_schema_are_consistent(self) -> None:
        config = (ROOT / "configs" / "sft-lora-proposal-v3.yaml").read_text(encoding="utf-8")
        info = json.loads((ROOT / "manifests" / "dataset-info.json").read_text(encoding="utf-8"))
        self.assertIn('dataset: "train"', config)
        self.assertIn('eval_dataset: "validation"', config)
        self.assertIn("template: qwen", config)
        self.assertEqual(info["format"], "UTF-8 JSONL Alpaca SFT")
        self.assertEqual(info["schema"]["fields"], ["instruction", "input", "output"])
        self.assertEqual(info["schema"]["instruction"], load_evaluator().INSTRUCTION)

    def test_parser_accepts_only_one_exact_label(self) -> None:
        parser = load_evaluator().parse_prediction
        self.assertEqual(parser("POSITIVO"), "positivo")
        self.assertEqual(parser(" neutro "), "neutro")
        self.assertEqual(parser("positivo porque..."), "<INVALID>")
        self.assertEqual(parser("2"), "<INVALID>")


if __name__ == "__main__":
    unittest.main()
