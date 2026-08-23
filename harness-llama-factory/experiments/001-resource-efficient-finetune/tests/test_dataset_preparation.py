from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.prepare_dataset import (  # noqa: E402
    INSTRUCTION,
    SourceRow,
    build_derived_record,
    normalize_text,
    resolve_duplicates,
    transformed_input,
    validate_derived_records,
)


class DatasetPreparationTests(unittest.TestCase):
    def test_redacts_handles_and_phones_without_changing_label_logic(self) -> None:
        transformed, counts = transformed_input("mensagem @pessoa 5511999999999")
        self.assertEqual(transformed, "mensagem <USUARIO> <TELEFONE>")
        self.assertEqual(counts, {"phone": 1, "handles": 1})

    def test_alpaca_schema_and_exact_instruction(self) -> None:
        row = SourceRow("train", 1, "texto", "positivo", "a", "b", "texto", "PT_HEURISTIC", (), (), False, False, [])
        row.transformed_input = "texto"
        record = build_derived_record(row)
        self.assertEqual(record["instruction"], INSTRUCTION)
        self.assertTrue(validate_derived_records({"train": [record], "validation": [], "frozen-test": []})["valid"])

    def test_duplicate_priority_keeps_frozen_test(self) -> None:
        frozen = SourceRow("test", 1, "mesmo texto", "positivo", "a", "n", normalize_text("mesmo texto"), "PT_HEURISTIC", (), (), False, False, [])
        train = SourceRow("train", 1, "mesmo texto", "positivo", "a", "n", normalize_text("mesmo texto"), "PT_HEURISTIC", (), (), False, False, [])
        kept, removed = resolve_duplicates([train, frozen])
        self.assertEqual([row.source_split for row in kept], ["test"])
        self.assertEqual(removed["duplicate_exact"], 1)


if __name__ == "__main__":
    unittest.main()
