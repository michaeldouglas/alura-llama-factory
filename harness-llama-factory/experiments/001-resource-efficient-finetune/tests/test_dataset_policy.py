from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.validate_dataset import (  # noqa: E402
    Row,
    assess_language,
    classify_content,
    sha256_text,
    summarize,
)


def row(split: str, index: int, text: str, label: str = "positivo") -> Row:
    pii, sensitive, url, handle = classify_content(text)
    return Row(split, index, text, label, sha256_text(text), sha256_text(text.casefold()), text.casefold(), len(text), assess_language(text), pii, sensitive, url, handle)


class DatasetPolicyTests(unittest.TestCase):
    def test_privacy_sensitive_and_language_findings_are_aggregated(self) -> None:
        rows = [
            row("train", 1, "Olá @pessoa email teste@example.com, telefone 5511999999999"),
            row("train", 2, "Isso é uma ameaça de morte e contém merda"),
            row("train", 3, "this is an english sentence"),
        ]
        summary = summarize(rows, {"global_errors": {}, "splits": {"train": {"valid_records": 3}}}, {"pairs": {}, "near_duplicate_pairs_total": 0})
        self.assertEqual(summary["decision"], "DATA_BLOCKED")
        self.assertGreater(summary["privacy_indicators"]["direct_pii_records_by_category"]["email"], 0)
        self.assertGreater(summary["privacy_indicators"]["direct_pii_records_by_category"]["phone"], 0)
        self.assertIn("sensitive_content_indicators", summary)
        self.assertGreater(summary["sensitive_content_indicators"]["records_by_category"]["violence"], 0)
        self.assertGreater(summary["language_heuristic"]["counts"]["NON_PT_HEURISTIC"], 0)


if __name__ == "__main__":
    unittest.main()
