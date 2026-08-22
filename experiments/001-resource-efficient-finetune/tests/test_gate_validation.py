from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.validate_gate import GateValidationError, validate_gate_document


class GateValidationTests(unittest.TestCase):
    def test_accepts_exact_approved_scope(self) -> None:
        document = {
            "gate_id": "G1-OP",
            "decision": "APPROVED",
            "scope_hash": "a" * 64,
            "authorized_actions": ["create_environment", "install_dependencies"],
        }
        validate_gate_document(
            document,
            expected_gate_id="G1-OP",
            required_actions=["create_environment"],
            expected_scope_hash="a" * 64,
        )

    def test_rejects_missing_action(self) -> None:
        document = {
            "gate_id": "G1-OP",
            "decision": "APPROVED",
            "scope_hash": "a" * 64,
            "authorized_actions": [],
        }
        with self.assertRaises(GateValidationError):
            validate_gate_document(
                document,
                expected_gate_id="G1-OP",
                required_actions=["install_dependencies"],
            )

    def test_rejects_stale_scope(self) -> None:
        document = {
            "gate_id": "G1-OP",
            "decision": "APPROVED",
            "scope_hash": "a" * 64,
            "authorized_actions": ["create_environment"],
        }
        with self.assertRaises(GateValidationError):
            validate_gate_document(
                document,
                expected_gate_id="G1-OP",
                required_actions=["create_environment"],
                expected_scope_hash="b" * 64,
            )


if __name__ == "__main__":
    unittest.main()
