from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from resolve_package_metadata import (
    GATE_ID,
    MetadataPolicyError,
    Requirement,
    choose_wheel,
    load_authorization_gate,
    parse_requirement,
    parse_version_override,
    requirement_applies,
    satisfies,
    validate_request,
    wheel_compatible,
)


class MetadataPolicyTests(unittest.TestCase):
    def test_allows_metadata_queries(self) -> None:
        validate_request("https://pypi.org/pypi/transformers/5.6.0/json", "GET")
        validate_request("https://download.pytorch.org/whl/xpu/torch/", "GET")
        validate_request("https://download.pytorch.org/whl/xpu/torch-2.9.1.whl", "HEAD")
        validate_request("https://download-r2.pytorch.org/whl/xpu/torch-2.9.1%2Bxpu-cp312-cp312-win_amd64.whl", "HEAD")
        validate_request("https://files.pythonhosted.org/example/pkg.whl.metadata", "GET")

    def test_rejects_method_host_and_payload_get(self) -> None:
        with self.assertRaises(MetadataPolicyError):
            validate_request("https://pypi.org/pypi/torch/json", "POST")
        with self.assertRaises(MetadataPolicyError):
            validate_request("https://example.com/metadata.json", "GET")
        with self.assertRaises(MetadataPolicyError):
            validate_request("https://download.pytorch.org/whl/xpu/torch.whl", "GET")
        with self.assertRaises(MetadataPolicyError):
            validate_request("https://download-r2.pytorch.org/whl/xpu/torch.whl", "GET")
        with self.assertRaises(MetadataPolicyError):
            validate_request("https://files.pythonhosted.org/pkg.tar.gz", "GET")

    def test_g1_metadata_2_record_is_exactly_accepted(self) -> None:
        gate = load_authorization_gate(
            ROOT / "manifests" / "gates" / "g1-metadata-2.json"
        )
        self.assertEqual(gate["gate_id"], GATE_ID)

    def test_target_marker_filter_is_fail_closed_for_extras(self) -> None:
        self.assertTrue(requirement_applies(parse_requirement("demo; python_version >= '3.12'")))
        self.assertFalse(requirement_applies(parse_requirement("demo; extra == 'vision'")))


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

    def test_supports_pep440_wildcards_and_compatible_releases(self) -> None:
        self.assertTrue(satisfies("1.7.2", parse_requirement("demo==1.*").specifiers))
        self.assertFalse(satisfies("2.0.0", parse_requirement("demo==1.*").specifiers))
        self.assertTrue(satisfies("3.11.0", parse_requirement("demo~=3.0").specifiers))
        self.assertFalse(satisfies("4.0.0", parse_requirement("demo~=3.0").specifiers))
        self.assertTrue(satisfies("6.0.3", parse_requirement("demo>=5.1.*").specifiers))

    def test_parses_normalized_version_override(self) -> None:
        self.assertEqual(parse_version_override("OmegaConf==2.0.6"), ("omegaconf", "2.0.6"))

    def test_rejects_non_exact_or_non_stable_version_override(self) -> None:
        with self.assertRaises(ValueError):
            parse_version_override("omegaconf>=2.0")
        with self.assertRaises(ValueError):
            parse_version_override("omegaconf==2.0.6rc1")


if __name__ == "__main__":
    unittest.main()
