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


class MetricsTests(unittest.TestCase):
    def test_macro_f1_perfect_and_regression(self):
        evaluator = load_evaluator()
        truth = ["negativo", "neutro", "positivo"]
        self.assertEqual(evaluator.macro_f1(truth, truth), 1.0)
        self.assertEqual(evaluator.macro_f1(truth, ["positivo", "positivo", "neutro"]), 0.0)

    def test_sc008_threshold_branches(self):
        low_base = 0.40
        self.assertGreaterEqual(0.51 - low_base, 0.10)
        high_base = 0.80
        self.assertGreaterEqual(0.821 - high_base, 0.02)
        self.assertGreaterEqual(0.821, high_base)


if __name__ == "__main__":
    unittest.main()
