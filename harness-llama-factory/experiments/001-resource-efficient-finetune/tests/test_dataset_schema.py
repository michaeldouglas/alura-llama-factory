from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.validate_dataset import read_rows  # noqa: E402


class DatasetSchemaTests(unittest.TestCase):
    def test_required_fields_utf8_length_and_numeric_labels_are_checked(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            files = {
                "data/portuguese/test.jsonl": {"path": "data/portuguese/test.jsonl"},
                "data/portuguese/train.jsonl": {"path": "data/portuguese/train.jsonl"},
                "data/portuguese/validation.jsonl": {"path": "data/portuguese/validation.jsonl"},
            }
            for relative in files:
                (root / relative).parent.mkdir(parents=True, exist_ok=True)
                (root / relative).write_bytes(b'{"text":"ok","label":0}\n')
            (root / "data/portuguese/train.jsonl").write_bytes(
                b'{"text":"","label":1}\n'
                + (b'{"text":"' + (b"a" * 281) + b'","label":2}\n')
                + b'{"text":"missing label"}\n'
                + b'{"text":"boolean","label":true}\n'
                + b'\xff\n'
            )
            rows, summary = read_rows(root, files)
            self.assertEqual(len(rows), 4)
            self.assertEqual(summary["global_errors"]["missing_required_field"], 1)
            self.assertEqual(summary["global_errors"]["invalid_label"], 1)
            self.assertEqual(summary["global_errors"]["invalid_utf8"], 1)
            self.assertEqual(summary["splits"]["train"]["errors"]["over_280_unicode_chars"], 1)
            self.assertEqual(summary["splits"]["train"]["errors"]["empty_text"], 1)


if __name__ == "__main__":
    unittest.main()
