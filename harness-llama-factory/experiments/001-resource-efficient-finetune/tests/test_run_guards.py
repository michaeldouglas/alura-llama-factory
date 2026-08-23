from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RunGuardTests(unittest.TestCase):
    def test_authorized_runner_enforces_single_run_and_sixty_minute_stop(self) -> None:
        runner = (ROOT / "scripts" / "run_authorized_experiment_v3.ps1").read_text(encoding="utf-8")
        proposal = json.loads((ROOT / "manifests" / "execution-proposal-v3.json").read_text(encoding="utf-8"))
        run = json.loads((ROOT / "manifests" / "experiment-run-v3.json").read_text(encoding="utf-8"))
        self.assertIn("Refusing retry", runner)
        self.assertIn("WaitForExit(60 * 60 * 1000)", runner)
        self.assertIn("Stop-Process", runner)
        self.assertEqual(proposal["estimates_and_stop_conditions"]["hard_stop_minutes"], 60)
        self.assertTrue(proposal["estimates_and_stop_conditions"]["stop_on_oom_or_nonfinite"])
        self.assertTrue(proposal["estimates_and_stop_conditions"]["stop_on_cpu_fallback"])
        self.assertFalse(run["retry_allowed"])

    def test_no_silent_fallback_and_collision_protection_are_recorded(self) -> None:
        proposal = json.loads((ROOT / "manifests" / "execution-proposal-v3.json").read_text(encoding="utf-8"))
        stops = proposal["estimates_and_stop_conditions"]
        self.assertTrue(stops["stop_on_output_collision"])
        self.assertTrue(stops["stop_on_hash_or_gate_mismatch"])
        self.assertTrue(stops["stop_on_material_configuration_change"])
        self.assertFalse(proposal["outputs"]["overwrite_output_dir"])


if __name__ == "__main__":
    unittest.main()
