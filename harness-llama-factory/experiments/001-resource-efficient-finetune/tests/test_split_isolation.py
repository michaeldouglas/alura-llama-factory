from __future__ import annotations

import hashlib
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.validate_dataset import Row, normalize_text, overlap_counts, sha256_text  # noqa: E402


def row(split: str, index: int, text: str) -> Row:
    normalized = normalize_text(text)
    return Row(split, index, text, "positivo", sha256_text(text), sha256_text(normalized), normalized, len(text), "PT_HEURISTIC", (), (), False, False)


class SplitIsolationTests(unittest.TestCase):
    def test_exact_normalized_and_near_duplicate_pairs_are_quantified(self) -> None:
        rows = [
            row("test", 1, "texto exato"),
            row("train", 1, "texto exato"),
            row("validation", 1, "  TEXTO   EXATO  "),
            row("test", 2, "mensagem portuguesa muito positiva para teste"),
            row("train", 2, "mensagem portuguesa muito positiva para testes"),
        ]
        result = overlap_counts(rows)
        self.assertEqual(result["pairs"]["test__train"]["exact_text_overlap"], 1)
        self.assertEqual(result["pairs"]["test__validation"]["normalized_text_overlap"], 1)
        self.assertGreaterEqual(result["pairs"]["test__train"]["near_duplicate_pairs"], 1)


if __name__ == "__main__":
    unittest.main()
