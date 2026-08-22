from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from resolve_package_metadata import (
    MetadataPolicyError,
    Requirement,
    choose_wheel,
    parse_requirement,
    satisfies,
    validate_request,
    wheel_compatible,
)


class MetadataPolicyTests(unittest.TestCase):
    def test_allows_metadata_queries(self) -> None:
        validate_request("https://pypi.org/pypi/transformers/5.6.0/json", "GET")
        validate_request("https://download.pytorch.org/whl/xpu/torch/", "GET")
        validate_request("https://download.pytorch.org/whl/xpu/torch-2.9.1.whl", "HEAD")
        validate_request("https://files.pythonhosted.org/example/pkg.whl.metadata", "GET")

    def test_rejects_method_host_and_payload_get(self) -> None:
        with self.assertRaises(MetadataPolicyError):
            validate_request("https://pypi.org/pypi/torch/json", "POST")
        with self.assertRaises(MetadataPolicyError):
            validate_request("https://example.com/metadata.json", "GET")
        with self.assertRaises(MetadataPolicyError):
            validate_request("https://download.pytorch.org/whl/xpu/torch.whl", "GET")
        with self.assertRaises(MetadataPolicyError):
            validate_request("https://files.pythonhosted.org/pkg.tar.gz", "GET")


class RequirementTests(unittest.TestCase):
    def test_parses_and_applies_simple_llamafactory_constraints(self) -> None:
        requirement = parse_requirement("transformers>=4.55.0,<=5.6.0,!=4.57.0")
        self.assertEqual(requirement.name, "transformers")
        self.assertTrue(satisfies("5.6.0", requirement.specifiers))
        self.assertFalse(satisfies("4.57.0", requirement.specifiers))
        self.assertFalse(satisfies("5.7.0", requirement.specifiers))

    def test_selects_compatible_wheel_without_downloading(self) -> None:
        files = [
            {"filename": "demo-1.0-cp313-cp313-win_amd64.whl", "packagetype": "bdist_wheel", "yanked": False},
            {"filename": "demo-1.0-cp312-cp312-win_amd64.whl", "packagetype": "bdist_wheel", "yanked": False},
        ]
        self.assertTrue(wheel_compatible(files[1]["filename"]))
        self.assertEqual(choose_wheel(files)["filename"], files[1]["filename"])


if __name__ == "__main__":
    unittest.main()
