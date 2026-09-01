from __future__ import annotations

import json
import unittest
from pathlib import Path

REPORT = Path(__file__).resolve().parents[1] / "reports" / "environment-g1.json"


class EnvironmentProfileTests(unittest.TestCase):
    def test_read_only_profile_is_complete(self) -> None:
        with REPORT.open("r", encoding="utf-8-sig") as stream:
            profile = json.load(stream)
        required = {
            "profile_id",
            "captured_at",
            "inspection_mode",
            "operating_system",
            "cpu",
            "gpu",
            "memory",
            "storage",
            "power",
            "python",
            "uv",
            "operational_actions_performed",
            "readiness",
        }
        self.assertTrue(required.issubset(profile))
        self.assertEqual(profile["inspection_mode"], "READ_ONLY")
        self.assertFalse(profile["operational_actions_performed"])
        self.assertFalse(profile["runtime_tested"])
        self.assertEqual(profile["readiness"], "OBSERVED")


if __name__ == "__main__":
    unittest.main()
