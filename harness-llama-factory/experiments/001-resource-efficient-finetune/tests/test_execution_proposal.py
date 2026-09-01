from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ExecutionProposalTests(unittest.TestCase):
    def test_v3_proposal_is_complete_and_matches_immutable_config_identity(self) -> None:
        proposal = json.loads((ROOT / "manifests" / "execution-proposal-v3.json").read_text(encoding="utf-8"))
        config_path = ROOT / "configs" / "sft-lora-proposal-v3.yaml"
        config_hash = hashlib.sha256(config_path.read_bytes()).hexdigest()
        configuration = proposal["configuration"]
        for key in ("template", "stage", "finetuning_type", "seed", "learning_rate", "num_train_epochs", "lora_rank", "lora_alpha"):
            self.assertIn(key, configuration)
        self.assertEqual(configuration["config_sha256"], config_hash)
        self.assertFalse(configuration["overwrite_output_dir"])
        self.assertIn("cache_path", proposal["model"])
        self.assertIn("derived_path", proposal["dataset"])
        self.assertIn("output_dir", proposal["outputs"])
        self.assertFalse(proposal["principal_training_authorized"])

    def test_material_config_change_changes_identity_and_run_is_unique(self) -> None:
        config = ROOT / "configs" / "sft-lora-proposal-v3.yaml"
        original = hashlib.sha256(config.read_bytes()).hexdigest()
        with tempfile.TemporaryDirectory() as directory:
            changed = Path(directory) / config.name
            changed.write_bytes(config.read_bytes() + b"\n# material test change\n")
            self.assertNotEqual(original, hashlib.sha256(changed.read_bytes()).hexdigest())
        run = json.loads((ROOT / "manifests" / "experiment-run-v3.json").read_text(encoding="utf-8"))
        self.assertTrue(run["run_id"].endswith("-v3"))
        self.assertNotIn(str(ROOT), run["output_dir"])
        self.assertEqual(run["retry_allowed"], False)


if __name__ == "__main__":
    unittest.main()
