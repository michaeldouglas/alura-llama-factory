from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.path_guards import PathPolicyError, validate_heavy_artifact_path


class PathGuardTests(unittest.TestCase):
    def test_rejects_repository_internal_path(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            repo = base / "repo"
            approved = base / "approved"
            repo.mkdir()
            approved.mkdir()
            with self.assertRaises(PathPolicyError):
                validate_heavy_artifact_path(
                    repo / "runs" / "run-1",
                    repository_root=repo,
                    approved_external_root=approved,
                )

    def test_rejects_existing_output(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            repo = base / "repo"
            approved = base / "approved"
            target = approved / "runs" / "run-1"
            repo.mkdir()
            target.mkdir(parents=True)
            with self.assertRaises(FileExistsError):
                validate_heavy_artifact_path(
                    target,
                    repository_root=repo,
                    approved_external_root=approved,
                )

    def test_accepts_new_nested_approved_path(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            repo = base / "repo"
            approved = base / "approved"
            repo.mkdir()
            approved.mkdir()
            target = approved / "runs" / "run-1"
            self.assertEqual(
                target.resolve(),
                validate_heavy_artifact_path(
                    target,
                    repository_root=repo,
                    approved_external_root=approved,
                ),
            )


if __name__ == "__main__":
    unittest.main()
