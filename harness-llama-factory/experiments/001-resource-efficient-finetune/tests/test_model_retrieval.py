from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ModelRetrievalTests(unittest.TestCase):
    def test_g2_op_gate_has_exact_model_scope(self) -> None:
        gate = json.loads((ROOT / "manifests" / "gates" / "g2-op.json").read_text(encoding="utf-8"))
        self.assertEqual(gate["gate_id"], "G2-OP")
        self.assertEqual(gate["decision"], "APPROVED")
        self.assertEqual(gate["repository_id"], "Qwen/Qwen2.5-0.5B-Instruct")
        self.assertEqual(gate["revision_sha"], "7ae557604adf67be50417f59c2c2f167def9a775")
        self.assertEqual(gate["expected_download_bytes"], 999604126)
        self.assertEqual(len(gate["expected_files"]), 10)
        self.assertEqual(sum(item["size"] for item in gate["expected_files"]), 999604126)

    def test_retrieval_script_is_fail_closed_and_excludes_training_actions(self) -> None:
        script = (ROOT / "scripts" / "fetch_model_source.py").read_text(encoding="utf-8")
        self.assertIn("refusing to overwrite", script)
        self.assertIn("expected_download_bytes", script)
        self.assertIn("sha256", script)
        self.assertIn("dataset_retrieved", script)
        self.assertNotIn("llamafactory-cli", script)
        self.assertNotIn("torch", script)


if __name__ == "__main__":
    unittest.main()
