from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.validate_dataset import (  # noqa: E402
    CONFIGURATION,
    REPOSITORY,
    REVISION,
    load_manifest,
    source_root,
    validate_source_hashes,
)


class DatasetSourceTests(unittest.TestCase):
    def _manifest(self, root: Path, payloads: dict[str, bytes]) -> Path:
        entries = []
        for relative, payload in payloads.items():
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)
            path.chmod(0o444)
            entries.append({"path": relative, "size_bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()})
        manifest = root / "manifest.json"
        manifest.write_text(json.dumps({
            "repository_id": REPOSITORY,
            "revision_sha": REVISION,
            "configuration": CONFIGURATION,
            "approval_state": "APPROVED_RETRIEVED",
            "transformation": "NONE",
            "read_only": True,
            "source_text_in_repository": False,
            "cache_path": str(root),
            "file_manifest": entries,
        }), encoding="utf-8")
        return manifest

    def test_pinned_read_only_source_and_hashes_are_accepted(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "external-source"
            payloads = {
                "data/portuguese/test.jsonl": b'{"text":"teste","label":0}\n',
                "data/portuguese/train.jsonl": b'{"text":"treino","label":1}\n',
                "data/portuguese/validation.jsonl": b'{"text":"validacao","label":2}\n',
            }
            manifest_path = self._manifest(root, payloads)
            manifest = load_manifest(manifest_path)
            self.assertEqual(source_root(manifest, ROOT), root.resolve())
            validate_source_hashes(root, {item["path"]: item for item in manifest["file_manifest"]})

    def test_checksum_mismatch_and_non_pinned_revision_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "external-source"
            payloads = {
                "data/portuguese/test.jsonl": b"a\n",
                "data/portuguese/train.jsonl": b"b\n",
                "data/portuguese/validation.jsonl": b"c\n",
            }
            manifest_path = self._manifest(root, payloads)
            entries = {item["path"]: item for item in json.loads(manifest_path.read_text(encoding="utf-8"))["file_manifest"]}
            (root / "data/portuguese/train.jsonl").chmod(0o666)
            (root / "data/portuguese/train.jsonl").write_bytes(b"changed\n")
            with self.assertRaises(ValueError):
                validate_source_hashes(root, entries)
            document = json.loads(manifest_path.read_text(encoding="utf-8"))
            document["revision_sha"] = "0" * 40
            manifest_path.write_text(json.dumps(document), encoding="utf-8")
            with self.assertRaises(ValueError):
                load_manifest(manifest_path)


if __name__ == "__main__":
    unittest.main()
