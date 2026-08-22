from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "resolve_runtime.ps1"
PROPOSAL = ROOT / "manifests" / "runtime-proposal.json"


class RuntimeResolutionTests(unittest.TestCase):
    def test_script_contains_no_operational_command(self) -> None:
        source = SCRIPT.read_text(encoding="utf-8")
        prohibited = [
            r"\buv\s+pip\s+install\b",
            r"\bpip\s+install\b",
            r"Invoke-WebRequest",
            r"Start-BitsTransfer",
            r"git\s+clone",
        ]
        for pattern in prohibited:
            self.assertIsNone(re.search(pattern, source, flags=re.IGNORECASE), pattern)

    def test_proposal_is_offline_and_non_operational(self) -> None:
        with PROPOSAL.open("r", encoding="utf-8-sig") as stream:
            proposal = json.load(stream)
        self.assertEqual(proposal["generation_mode"], "OFFLINE_READ_ONLY")
        self.assertFalse(proposal["network_access_performed"])
        self.assertFalse(proposal["installation_performed"])
        self.assertEqual(proposal["python"]["version"], "3.12")
        self.assertEqual(proposal["python"]["architecture"], "x86_64")
        self.assertEqual(proposal["policy"]["source_builds"], "DENY")
        self.assertEqual(proposal["policy"]["nightly_packages"], "DENY")
        self.assertNotEqual(proposal["readiness"], "READY_FOR_INSTALLATION")


if __name__ == "__main__":
    unittest.main()
