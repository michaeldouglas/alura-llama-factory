from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.prepare_dataset import (  # noqa: E402
    INSTRUCTION,
    LABELS,
    SourceRow,
    build_derived_record,
    validate_derived_records,
)


class DatasetConversionTests(unittest.TestCase):
    def test_all_numeric_labels_map_to_the_frozen_portuguese_labels(self) -> None:
        self.assertEqual(LABELS, {"0": "negativo", "1": "neutro", "2": "positivo"})
        records = {}
        for number, label in LABELS.items():
            source = SourceRow("train", int(number) + 1, "texto " + label, label, "x", "y", "texto " + label, "PT_HEURISTIC", (), (), False, False, [], "texto " + label)
            records[number] = [build_derived_record(source)]
        for record in records.values():
            self.assertEqual(record[0]["instruction"], INSTRUCTION)
        self.assertEqual({record[0]["output"] for record in records.values()}, set(LABELS.values()))

    def test_alpaca_schema_rejects_wrong_instruction_output_and_unredacted_pii(self) -> None:
        invalid = {"train": [{"instruction": "errada", "input": "texto @usuario", "output": "2"}]}
        result = validate_derived_records(invalid)
        self.assertFalse(result["valid"])
        self.assertIn("instruction", result["errors"])
        self.assertIn("output", result["errors"])
        self.assertIn("unredacted_handle_or_phone", result["errors"])


if __name__ == "__main__":
    unittest.main()
