from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class RuntimeValidationScriptTests(unittest.TestCase):
    def test_runtime_validation_is_read_only_and_xpu_focused(self) -> None:
        script = (ROOT / "scripts" / "validate_runtime.ps1").read_text(encoding="utf-8")
        smoke = (ROOT / "scripts" / "runtime_smoke.py").read_text(encoding="utf-8")
        self.assertIn("@('pip', 'check'", script)
        self.assertIn("llamafactory-cli.exe", script)
        self.assertIn("--mode", script)
        self.assertIn("torch.xpu.is_available", smoke)
        self.assertIn("torch.xpu.synchronize", smoke)
        self.assertIn("optimizer.step", smoke)
        self.assertNotIn("pip', 'install", script)
        self.assertNotIn("git+https://", script)
        self.assertNotIn("model_path", script)
        self.assertNotIn("dataset_path", script)


if __name__ == "__main__":
    unittest.main()
