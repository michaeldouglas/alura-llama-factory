from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.manifest_utils import canonical_json, sha256_json, write_json_new


class ManifestUtilsTests(unittest.TestCase):
    def test_canonical_json_is_order_independent(self) -> None:
        left = {"b": 2, "a": ["ç", 1]}
        right = {"a": ["ç", 1], "b": 2}
        self.assertEqual(canonical_json(left), canonical_json(right))
        self.assertEqual(sha256_json(left), sha256_json(right))

    def test_write_json_new_refuses_overwrite(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "manifest.json"
            write_json_new(target, {"state": "first"})
            with self.assertRaises(FileExistsError):
                write_json_new(target, {"state": "second"})


if __name__ == "__main__":
    unittest.main()
