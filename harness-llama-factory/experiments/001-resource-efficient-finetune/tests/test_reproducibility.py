import hashlib
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[3]


class ReproducibilityTests(unittest.TestCase):
    def test_evaluation_record_has_identity_and_metrics(self):
        report = json.loads((ROOT / "experiments/001-resource-efficient-finetune/reports/evaluation-g8.json").read_text(encoding="utf-8"))
        for key in ("run_id", "model_revision", "dataset_revision", "selection", "base", "adapted", "comparison"):
            self.assertIn(key, report)
        self.assertEqual(report["selection"]["record_count"], 90)
        self.assertEqual(report["base"]["metrics"]["prediction_sequence_sha256"], "84b3d50548cbb759b6fa1362359273ebd330fc97ca41595cc0cf573da855c449")

    def test_checkpoint_hashes_match_external_files(self):
        report = json.loads((ROOT / "experiments/001-resource-efficient-finetune/reports/evaluation-g8.json").read_text(encoding="utf-8"))
        checkpoint = Path(report["checkpoint"]["path"])
        for name, expected in report["checkpoint"]["files_sha256"].items():
            digest = hashlib.sha256((checkpoint / name).read_bytes()).hexdigest()
            self.assertEqual(digest, expected)


if __name__ == "__main__":
    unittest.main()
