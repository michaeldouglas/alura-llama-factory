from __future__ import annotations

import sys
import unittest
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.validate_gate import GateValidationError, validate_gate_document


class GateValidationTests(unittest.TestCase):
    def test_recorded_g1_op_gate_has_exact_runtime_scope(self) -> None:
        gate_path = ROOT / "manifests" / "gates" / "g1-op.json"
        with gate_path.open("r", encoding="utf-8") as stream:
            document = json.load(stream)
        validate_gate_document(
            document,
            expected_gate_id="G1-OP",
            required_actions=[
                "create_environment",
                "install_locked_dependencies",
                "install_llamafactory_at_pinned_revision",
                "write_g1_op_evidence",
            ],
        )
        self.assertEqual(document["package_set"]["resolved_requirement_count"], 103)
        self.assertEqual(document["python"]["version"], "3.12.12")
        self.assertFalse(document["superseded"])

    def test_recorded_g1_op_v4_gate_has_exact_xpu_scope(self) -> None:
        gate_path = ROOT / "manifests" / "gates" / "g1-op-v4.json"
        with gate_path.open("r", encoding="utf-8") as stream:
            document = json.load(stream)
        validate_gate_document(
            document,
            expected_gate_id="G1-OP-V4",
            required_actions=[
                "create_environment",
                "resume_partial_environment",
                "install_locked_dependencies",
                "install_llamafactory_at_pinned_revision",
                "write_g1_op_evidence",
            ],
        )
        self.assertEqual(document["package_set"]["resolved_requirement_count"], 121)
        self.assertEqual(document["package_set"]["additional_package_count"], 18)
        self.assertEqual(document["python"]["version"], "3.12.12")
        self.assertEqual(document["lock_sha256"], "E4C14B7F81B30B8D5958AC26D7CBB033E8BADF20FA56041DF87231AD1E04BD5A")

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
