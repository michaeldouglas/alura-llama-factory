"""Resolve official package metadata without downloading package payloads.

The resolver is intentionally incomplete when PyPI/GitHub/index metadata cannot
prove a full transitive lock. It never creates an environment or invokes an
installer. Every HTTPS request is checked against the G1-METADATA allowlist.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import html
import json
import re
import subprocess
import tomllib
import urllib.parse
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from manifest_utils import write_json_new


ALLOWED_HOSTS = {
    "api.github.com",
    "download.pytorch.org",
    "files.pythonhosted.org",
    "github.com",
    "pypi.org",
    "raw.githubusercontent.com",
}
ALLOWED_METHODS = {"GET", "HEAD"}
PAYLOAD_SUFFIXES = (
    ".whl",
    ".tar.gz",
    ".tar.bz2",
    ".tgz",
    ".zip",
    ".exe",
    ".msi",
    ".7z",
    ".safetensors",
    ".gguf",
    ".ckpt",
    ".pt",
    ".pth",
)
MAX_METADATA_BODY_BYTES = 25 * 1024 * 1024
USER_AGENT = "alura-llama-factory-metadata-resolver/1.0"
LLAMAFACTORY_COMMIT = "7af909522a951e3ad9f022ea6f88b6755257eaa5"
PYTHON_REQUEST = "3.12"
TARGET_PYTHON = (3, 12)


class MetadataPolicyError(ValueError):
    """Raised before a request that exceeds the metadata-only authorization."""


class MetadataTransportError(RuntimeError):
    """Raised when the existing system HTTPS client cannot return metadata safely."""


@dataclass(frozen=True)
class Requirement:
    name: str
    specifiers: tuple[tuple[str, str], ...]
    original: str


def normalize_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def validate_request(url: str, method: str) -> None:
    parsed = urllib.parse.urlsplit(url)
    normalized_method = method.upper()
    host = (parsed.hostname or "").lower()
    decoded_path = urllib.parse.unquote(parsed.path).lower()
    if parsed.scheme != "https":
        raise MetadataPolicyError("only HTTPS metadata requests are allowed")
    if host not in ALLOWED_HOSTS:
        raise MetadataPolicyError(f"host is not allowlisted: {host}")
    if normalized_method not in ALLOWED_METHODS:
        raise MetadataPolicyError(f"HTTP method is not allowed: {normalized_method}")
    if normalized_method == "GET" and decoded_path.endswith(PAYLOAD_SUFFIXES):
        if not (host == "files.pythonhosted.org" and decoded_path.endswith(".metadata")):
            raise MetadataPolicyError(f"GET package/source payload is prohibited: {decoded_path}")
    if host == "files.pythonhosted.org" and normalized_method == "GET" and not decoded_path.endswith(".metadata"):
        raise MetadataPolicyError("files.pythonhosted.org GET is restricted to PEP 658 .metadata")
    if host == "download.pytorch.org" and normalized_method == "GET":
        if not (decoded_path.endswith("/") or decoded_path.endswith(".html")):
            raise MetadataPolicyError("PyTorch GET is restricted to index metadata")


class MetadataClient:
    def __init__(self) -> None:
        self.requests: list[dict[str, Any]] = []

    def request(self, url: str, method: str = "GET", accept: str = "application/json") -> bytes:
        method = method.upper()
        current_url = url
        for _ in range(6):
            validate_request(current_url, method)
            marker = b"\n__ALURA_CURL_METADATA__"
            length_marker = b"\n__ALURA_CURL_LENGTH__"
            command = [
                "curl.exe",
                "--disable",
                "--silent",
                "--show-error",
                "--proto",
                "=https",
                "--max-redirs",
                "0",
                "--connect-timeout",
                "15",
                "--max-time",
                "45",
                "--user-agent",
                USER_AGENT,
                "--header",
                f"Accept: {accept}",
                "--request",
                method,
                "--write-out",
                "\n__ALURA_CURL_METADATA__%{json}\n__ALURA_CURL_LENGTH__%header{content-length}",
            ]
            if method == "GET":
                command.extend(["--max-filesize", str(MAX_METADATA_BODY_BYTES), "--output", "-"])
            else:
                command.extend(["--output", "NUL"])
            command.append(current_url)
            completed = subprocess.run(command, capture_output=True, check=False)
            if completed.returncode != 0:
                raise MetadataTransportError(
                    f"curl metadata request failed ({completed.returncode}) for {current_url}: "
                    + completed.stderr.decode("utf-8", errors="replace").strip()
                )
            if marker not in completed.stdout or length_marker not in completed.stdout:
                raise MetadataTransportError(f"curl metadata markers were absent for {current_url}")
            body, metadata_tail = completed.stdout.rsplit(marker, 1)
            metadata_bytes, raw_length = metadata_tail.split(length_marker, 1)
            curl_metadata = json.loads(metadata_bytes.decode("utf-8"))
            content_length = _int_or_none(raw_length.decode("utf-8", errors="replace").strip())
            redirect_url = curl_metadata.get("redirect_url") or ""
            record = {
                "method": method,
                "url": current_url,
                "final_url": curl_metadata.get("url_effective"),
                "status": int(curl_metadata.get("http_code") or 0),
                "content_type": curl_metadata.get("content_type"),
                "content_length_header": content_length,
                "body_bytes": len(body),
                "body_sha256": hashlib.sha256(body).hexdigest() if body else None,
            }
            self.requests.append(record)
            if redirect_url:
                validate_request(redirect_url, method)
                current_url = redirect_url
                continue
            if record["status"] >= 400:
                raise MetadataTransportError(f"HTTPS metadata status {record['status']} for {current_url}")
            return body
        raise MetadataTransportError(f"too many metadata redirects for {url}")

    def json(self, url: str) -> dict[str, Any]:
        return json.loads(self.request(url, "GET", "application/json").decode("utf-8"))

    def text(self, url: str, accept: str = "text/html") -> str:
        return self.request(url, "GET", accept).decode("utf-8")

    def head(self, url: str) -> dict[str, Any]:
        self.request(url, "HEAD", "*/*")
        return self.requests[-1]


def _int_or_none(value: str | None) -> int | None:
    try:
        return int(value) if value is not None else None
    except ValueError:
        return None


def parse_requirement(value: str) -> Requirement:
    base = value.split(";", 1)[0].strip()
    match = re.match(r"^([A-Za-z0-9_.-]+)(?:\[[^]]+\])?\s*(.*)$", base)
    if not match:
        raise ValueError(f"unsupported requirement: {value}")
    name, raw_spec = match.groups()
    specifiers: list[tuple[str, str]] = []
    if raw_spec:
        for part in raw_spec.split(","):
            part = part.strip()
            spec_match = re.match(r"^(===|==|!=|<=|>=|<|>|~=)\s*(.+)$", part)
            if not spec_match:
                raise ValueError(f"unsupported specifier {part!r} in {value!r}")
            specifiers.append((spec_match.group(1), spec_match.group(2)))
    return Requirement(normalize_name(name), tuple(specifiers), value)


def stable_version_key(value: str) -> tuple[int, ...] | None:
    if re.search(r"(?i)(a|b|rc|dev)", value):
        return None
    match = re.match(r"^(\d+(?:\.\d+)*)(?:\.post(\d+))?(?:\+.*)?$", value)
    if not match:
        return None
    parts = tuple(int(item) for item in match.group(1).split("."))
    post = int(match.group(2) or 0)
    return parts + (post,)


def _pad(left: tuple[int, ...], right: tuple[int, ...]) -> tuple[tuple[int, ...], tuple[int, ...]]:
    length = max(len(left), len(right))
    return left + (0,) * (length - len(left)), right + (0,) * (length - len(right))


def satisfies(version: str, specifiers: Iterable[tuple[str, str]]) -> bool:
    candidate = stable_version_key(version)
    if candidate is None:
        return False
    for operator, raw_expected in specifiers:
        expected = stable_version_key(raw_expected)
        if expected is None:
            return False
        left, right = _pad(candidate, expected)
        if operator in {"==", "==="} and left != right:
            return False
        if operator == "!=" and left == right:
            return False
        if operator == ">=" and left < right:
            return False
        if operator == "<=" and left > right:
            return False
        if operator == ">" and left <= right:
            return False
        if operator == "<" and left >= right:
            return False
        if operator == "~=":
            if left < right:
                return False
            prefix = expected[:-1] if len(expected) > 1 else expected
            if candidate[: len(prefix)] != prefix:
                return False
    return True


def wheel_compatible(filename: str) -> bool:
    lower = filename.lower()
    if not lower.endswith(".whl"):
        return False
    if re.search(r"-(?:py2\.)?py3-none-any\.whl$", lower):
        return True
    if re.search(r"-cp312-(?:cp312|abi3)-win_amd64\.whl$", lower):
        return True
    abi3 = re.search(r"-cp3(\d+)-abi3-win_amd64\.whl$", lower)
    return bool(abi3 and int(abi3.group(1)) <= 12)


def choose_wheel(files: Iterable[dict[str, Any]]) -> dict[str, Any] | None:
    candidates = [
        item
        for item in files
        if item.get("packagetype") == "bdist_wheel"
        and not item.get("yanked", False)
        and wheel_compatible(item.get("filename", ""))
    ]
    if not candidates:
        return None
    candidates.sort(key=lambda item: ("none-any" not in item["filename"].lower(), item["filename"]))
    return candidates[0]


def highest_release(metadata: dict[str, Any], requirement: Requirement) -> str | None:
    versions: list[tuple[tuple[int, ...], str]] = []
    for version, files in metadata.get("releases", {}).items():
        key = stable_version_key(version)
        if key is None or not files or not satisfies(version, requirement.specifiers):
            continue
        if any(not item.get("yanked", False) for item in files):
            versions.append((key, version))
    return max(versions)[1] if versions else None


def pypi_file_record(file: dict[str, Any]) -> dict[str, Any]:
    return {
        "filename": file.get("filename"),
        "url": file.get("url"),
        "size_bytes": file.get("size"),
        "sha256": (file.get("digests") or {}).get("sha256"),
        "requires_python": file.get("requires_python"),
        "yanked": file.get("yanked", False),
    }


def resolve_python_identity(client: MetadataClient) -> dict[str, Any]:
    command = [
        "uv", "python", "list", PYTHON_REQUEST, "--all-versions", "--only-downloads",
        "--show-urls", "--output-format", "json", "--offline", "--no-cache",
        "--no-python-downloads", "--no-config",
    ]
    completed = subprocess.run(command, check=True, capture_output=True, text=True)
    candidates = json.loads(completed.stdout)
    windows = [
        item for item in candidates
        if item.get("implementation") == "cpython"
        and item.get("os") == "windows"
        and item.get("arch") == "x86_64"
    ]
    selected = max(windows, key=lambda item: tuple(item["version_parts"].values()))
    asset_url = selected["url"]
    match = re.search(r"/download/([^/]+)/(.+)$", asset_url)
    if not match:
        raise ValueError(f"unexpected python-build-standalone URL: {asset_url}")
    tag, encoded_name = match.groups()
    release = client.json(f"https://api.github.com/repos/astral-sh/python-build-standalone/releases/tags/{tag}")
    expected_name = urllib.parse.unquote(encoded_name)
    asset = next((item for item in release.get("assets", []) if item.get("name") == expected_name), None)
    if asset is None:
        raise ValueError(f"Python asset was not present in release metadata: {expected_name}")
    return {
        "key": selected["key"],
        "version": selected["version"],
        "uv_bundled_metadata_url": asset_url,
        "release_tag": tag,
        "asset_id": asset.get("id"),
        "asset_name": asset.get("name"),
        "asset_size_bytes": asset.get("size"),
        "asset_digest": asset.get("digest"),
        "asset_updated_at": asset.get("updated_at"),
        "asset_api_url": asset.get("url"),
        "payload_downloaded": False,
    }


def load_llamafactory_metadata(client: MetadataClient) -> tuple[dict[str, Any], list[Requirement]]:
    url = f"https://api.github.com/repos/hiyouga/LlamaFactory/contents/pyproject.toml?ref={LLAMAFACTORY_COMMIT}"
    response = client.json(url)
    content = base64.b64decode(re.sub(r"\s", "", response["content"]))
    project = tomllib.loads(content.decode("utf-8"))["project"]
    requirements = [parse_requirement(item) for item in project["dependencies"]]
    requirements.append(parse_requirement("scikit-learn"))
    tree = client.json(f"https://api.github.com/repos/hiyouga/LlamaFactory/git/trees/{LLAMAFACTORY_COMMIT}?recursive=1")
    source_blob_bytes = sum(
        int(item.get("size", 0)) for item in tree.get("tree", []) if item.get("type") == "blob"
    )
    metadata = {
        "name": project["name"],
        "version": "0.9.5",
        "revision": LLAMAFACTORY_COMMIT,
        "requires_python": project.get("requires-python"),
        "pyproject_git_blob_sha": response.get("sha"),
        "pyproject_sha256": hashlib.sha256(content).hexdigest(),
        "source_tree_blob_bytes": source_blob_bytes,
        "source_tree_truncated": tree.get("truncated", False),
        "source_payload_downloaded": False,
    }
    return metadata, requirements


def find_xpu_wheel(client: MetadataClient, name: str, version: str) -> dict[str, Any] | None:
    index_url = f"https://download.pytorch.org/whl/xpu/{name}/"
    document = client.text(index_url)
    links = re.findall(r'href=["\']([^"\']+)["\']', document, flags=re.IGNORECASE)
    decoded_version = version.replace("+", r"(?:\+|%2B)")
    pattern = re.compile(
        rf"{re.escape(name)}-{decoded_version}-cp312-cp312-win_amd64\.whl",
        flags=re.IGNORECASE,
    )
    for raw_link in links:
        unescaped = html.unescape(raw_link)
        absolute = urllib.parse.urljoin(index_url, unescaped)
        parsed = urllib.parse.urlsplit(absolute)
        filename = urllib.parse.unquote(Path(parsed.path).name)
        if not pattern.fullmatch(filename):
            continue
        fragment = urllib.parse.parse_qs(parsed.fragment)
        sha256 = fragment.get("sha256", [None])[0]
        without_fragment = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ""))
        head = client.head(without_fragment)
        return {
            "filename": filename,
            "url": without_fragment,
            "size_bytes": head.get("content_length_header"),
            "sha256": sha256,
            "requires_python": ">=3.10",
            "payload_downloaded": False,
        }
    return None


def resolve_direct_requirement(client: MetadataClient, requirement: Requirement) -> dict[str, Any]:
    exact_overrides = {
        "torch": "2.9.1",
        "torchvision": "0.24.1",
        "torchaudio": "2.9.1",
    }
    package = requirement.name
    if package in exact_overrides:
        version = exact_overrides[package]
        metadata = client.json(f"https://pypi.org/pypi/{package}/{version}/json")
    else:
        metadata = client.json(f"https://pypi.org/pypi/{package}/json")
        latest = metadata.get("info", {}).get("version")
        version = latest if latest and satisfies(latest, requirement.specifiers) else highest_release(metadata, requirement)
        if version is None:
            return {
                "name": package,
                "requirement": requirement.original,
                "status": "NO_STABLE_VERSION_SATISFIES_CONSTRAINT",
            }
        if version != latest:
            metadata = client.json(f"https://pypi.org/pypi/{package}/{version}/json")

    if package in exact_overrides:
        wheel = find_xpu_wheel(client, package, version + "+xpu")
    else:
        wheel = choose_wheel(metadata.get("urls", []))
        wheel = pypi_file_record(wheel) if wheel else None
        if wheel is not None:
            wheel["payload_downloaded"] = False

    requirements = metadata.get("info", {}).get("requires_dist") or []
    return {
        "name": package,
        "requirement": requirement.original,
        "selected_version": version + ("+xpu" if package in exact_overrides else ""),
        "requires_python": metadata.get("info", {}).get("requires_python"),
        "requires_dist": requirements,
        "wheel": wheel,
        "status": "CANDIDATE" if wheel else "NO_COMPATIBLE_CP312_WINDOWS_WHEEL_METADATA",
    }


def transitive_names(direct: Iterable[dict[str, Any]]) -> list[str]:
    names: set[str] = set()
    for item in direct:
        for requirement in item.get("requires_dist", []):
            if "extra ==" in requirement or "extra !=" in requirement:
                continue
            match = re.match(r"^([A-Za-z0-9_.-]+)", requirement)
            if match:
                names.add(normalize_name(match.group(1)))
    return sorted(names)


def build_lock() -> dict[str, Any]:
    client = MetadataClient()
    python_identity = resolve_python_identity(client)
    llamafactory, requirements = load_llamafactory_metadata(client)
    direct: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    for requirement in requirements:
        try:
            direct.append(resolve_direct_requirement(client, requirement))
        except (MetadataTransportError, MetadataPolicyError, ValueError) as error:
            failures.append({"requirement": requirement.original, "error": str(error)})

    missing_wheels = [item["name"] for item in direct if item.get("status") != "CANDIDATE"]
    direct_payload_bytes = sum(
        int(item["wheel"]["size_bytes"])
        for item in direct
        if item.get("wheel") and item["wheel"].get("size_bytes") is not None
    )
    python_bytes = int(python_identity.get("asset_size_bytes") or 0)
    unresolved = transitive_names(direct)
    digest_missing = python_identity.get("asset_digest") is None
    lock_status = "INCOMPLETE_METADATA_ONLY_LOCK"
    blockers = [
        "Transitive dependencies are enumerated but not solved into a conflict-checked exact lock.",
        "Installed disk size cannot be proven from compressed artifact metadata alone.",
    ]
    if digest_missing:
        blockers.append("The Python release API did not provide a cryptographic asset digest.")
    if missing_wheels:
        blockers.append("Compatible wheel metadata is missing for: " + ", ".join(missing_wheels))
    if failures:
        blockers.append("One or more metadata requests or parsers failed; see resolution_failures.")

    return {
        "lock_id": "runtime-metadata-lock-g1",
        "generated_mode": "AUTHORIZED_METADATA_ONLY",
        "authorization_gate": "G1-METADATA",
        "network_methods_used": sorted({item["method"] for item in client.requests}),
        "payload_downloads_performed": False,
        "environment_created": False,
        "packages_installed": False,
        "python": python_identity,
        "llamafactory": llamafactory,
        "direct_requirements": direct,
        "transitive_requirement_names": unresolved,
        "transitive_requirement_count": len(unresolved),
        "resolution_failures": failures,
        "size_evidence": {
            "python_archive_bytes": python_bytes or None,
            "direct_wheel_archives_bytes": direct_payload_bytes,
            "known_direct_transfer_bytes": python_bytes + direct_payload_bytes,
            "source_tree_blob_bytes": llamafactory["source_tree_blob_bytes"],
            "complete_download_bytes": None,
            "complete_cache_bytes": None,
            "installed_bytes": None,
        },
        "lock_status": lock_status,
        "blockers_before_g1_op": blockers,
        "request_log": client.requests,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    arguments = parser.parse_args()
    lock = build_lock()
    write_json_new(arguments.output, lock)
    print(arguments.output.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
