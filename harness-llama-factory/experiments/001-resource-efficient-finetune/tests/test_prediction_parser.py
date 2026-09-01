import importlib.util
import unittest
from pathlib import Path


def load_evaluator():
    path = Path(__file__).parents[1] / "scripts" / "evaluate_frozen_set.py"
    spec = importlib.util.spec_from_file_location("evaluate_frozen_set", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class PredictionParserTests(unittest.TestCase):
    def test_exact_labels_and_invalid_outputs(self):
        evaluator = load_evaluator()
        self.assertEqual(evaluator.parse_prediction("  POSITIVO\n"), "positivo")
        self.assertEqual(evaluator.parse_prediction("neutro"), "neutro")
        self.assertEqual(evaluator.parse_prediction("positivo e explicação"), "<INVALID>")

    def test_summary_preserves_ordered_prediction_hash(self):
        evaluator = load_evaluator()
        first = evaluator.summarize(["positivo", "neutro"], [" positivo ", "INVALID"])
        second = evaluator.summarize(["positivo", "neutro"], [" positivo ", "INVALID"])
        self.assertEqual(first["prediction_sequence_sha256"], second["prediction_sequence_sha256"])
        self.assertEqual(first["invalid_label_rate"], 0.5)


if __name__ == "__main__":
    unittest.main()
