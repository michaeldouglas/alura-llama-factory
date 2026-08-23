"""Resolve official package metadata without downloading package payloads.

The resolver never creates an environment or invokes an installer. Every HTTPS
request is checked against the exact G1-METADATA-2 allowlist. Package payloads
are never requested: PyPI JSON, index HTML and PEP 658 metadata are the only
GET bodies; XPU wheel URLs are inspected with HEAD only.
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

from manifest_utils import sha256_file, write_json_new


ALLOWED_HOSTS = {
    "api.github.com",
    "download.pytorch.org",
    "download-r2.pytorch.org",
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
GATE_ID = "G1-METADATA-2"
WINDOWS_XPU_RUNTIME_REQUIREMENTS = (
    "intel-cmplr-lib-rt==2025.2.1",
    "intel-cmplr-lib-ur==2025.2.1",
    "intel-cmplr-lic-rt==2025.2.1",
    "intel-sycl-rt==2025.2.1",
    "onemkl-sycl-blas==2025.2.0",
    "onemkl-sycl-dft==2025.2.0",
    "onemkl-sycl-lapack==2025.2.0",
    "onemkl-sycl-rng==2025.2.0",
    "onemkl-sycl-sparse==2025.2.0",
    "dpcpp-cpp-rt==2025.2.1",
    "intel-opencl-rt==2025.2.1",
    "mkl==2025.2.0",
    "intel-openmp==2025.2.1",
    "tbb==2022.2.0",
    "tcmlib==1.4.0",
    "umf==0.11.0",
    "intel-pti==0.13.1",
    "pytorch-triton-xpu==3.5.0",
)
XPU_VERSION_OVERRIDES = {
    "torch": ("2.9.1", "+xpu"),
    "torchvision": ("0.24.1", "+xpu"),
    "torchaudio": ("2.9.1", "+xpu"),
    "pytorch-triton-xpu": ("3.5.0", ""),
}
REQUIRED_GATE_ACTIONS = {
    "resolve_https_metadata",
    "write_versioned_metadata_lock",
    "write_versioned_metadata_proposal",
    "resolve_recursive_transitive_metadata",
    "inspect_xpu_artifact_headers",
}


class MetadataPolicyError(ValueError):
    """Raised before a request that exceeds the metadata-only authorization."""


class MetadataTransportError(RuntimeError):
    """Raised when the existing system HTTPS client cannot return metadata safely."""


@dataclass(frozen=True)
class Requirement:
    name: str
    specifiers: tuple[tuple[str, str], ...]
    original: str
    marker: str | None = None


def normalize_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def validate_request(url: str, method: str, allowed_hosts: set[str] | None = None) -> None:
    parsed = urllib.parse.urlsplit(url)
    normalized_method = method.upper()
    host = (parsed.hostname or "").lower()
    decoded_path = urllib.parse.unquote(parsed.path).lower()
    if parsed.scheme != "https":
        raise MetadataPolicyError("only HTTPS metadata requests are allowed")
    if host not in (allowed_hosts or ALLOWED_HOSTS):
        raise MetadataPolicyError(f"host is not allowlisted: {host}")
    if normalized_method not in ALLOWED_METHODS:
        raise MetadataPolicyError(f"HTTP method is not allowed: {normalized_method}")
    if normalized_method == "GET" and decoded_path.endswith(PAYLOAD_SUFFIXES):
        if not (host == "files.pythonhosted.org" and decoded_path.endswith(".metadata")):
            raise MetadataPolicyError(f"GET package/source payload is prohibited: {decoded_path}")
    if host == "files.pythonhosted.org" and normalized_method == "GET" and not decoded_path.endswith(".metadata"):
        raise MetadataPolicyError("files.pythonhosted.org GET is restricted to PEP 658 .metadata")
    if host == "download-r2.pytorch.org" and normalized_method == "GET":
        raise MetadataPolicyError("PyTorch R2 GET is prohibited; use HEAD for artifact URLs")
    if host == "download.pytorch.org" and normalized_method == "GET":
        if not (decoded_path.endswith("/") or decoded_path.endswith(".html")):
            raise MetadataPolicyError("PyTorch GET is restricted to index metadata")


class MetadataClient:
    def __init__(self, allowed_hosts: set[str] | None = None) -> None:
        self.requests: list[dict[str, Any]] = []
        self.allowed_hosts = set(allowed_hosts or ALLOWED_HOSTS)

    def request(self, url: str, method: str = "GET", accept: str = "application/json") -> bytes:
        method = method.upper()
        current_url = url
        for _ in range(6):
            validate_request(current_url, method, self.allowed_hosts)
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
                command.extend(["--head", "--output", "NUL"])
            command.append(current_url)
            completed = subprocess.run(command, capture_output=True, check=False)
            if completed.returncode != 0:
                self.requests.append({
                    "method": method,
                    "url": current_url,
                    "final_url": None,
                    "status": 0,
                    "content_type": None,
                    "content_length_header": None,
                    "body_bytes": 0,
                    "body_sha256": None,
                    "error": completed.stderr.decode("utf-8", errors="replace").strip(),
                    "curl_exit_code": completed.returncode,
                })
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
                validate_request(redirect_url, method, self.allowed_hosts)
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
    base, separator, raw_marker = value.partition(";")
    base = base.strip()
    marker = raw_marker.strip() if separator else None
    match = re.match(r"^([A-Za-z0-9_.-]+)(?:\[[^]]+\])?\s*(.*)$", base)
    if not match:
        raise ValueError(f"unsupported requirement: {value}")
    name, raw_spec = match.groups()
    specifiers: list[tuple[str, str]] = []
    if raw_spec:
        raw_spec = raw_spec.strip()
        if raw_spec.startswith("(") and raw_spec.endswith(")"):
            raw_spec = raw_spec[1:-1].strip()
        for part in raw_spec.split(","):
            part = part.strip()
            spec_match = re.match(r"^(===|==|!=|<=|>=|<|>|~=)\s*(.+)$", part)
            if not spec_match:
                raise ValueError(f"unsupported specifier {part!r} in {value!r}")
            specifiers.append((spec_match.group(1), spec_match.group(2)))
    return Requirement(normalize_name(name), tuple(specifiers), value, marker)


TARGET_MARKER_VALUES = {
    "python_version": "3.12",
    "python_full_version": "3.12.12",
    "sys_platform": "win32",
    "platform_system": "Windows",
    "platform_machine": "AMD64",
    "os_name": "nt",
    "implementation_name": "cpython",
    "platform_python_implementation": "CPython",
}


def _marker_atom_applies(atom: str) -> bool:
    atom = atom.strip().strip("() ")
    match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*(===|==|!=|<=|>=|<|>|~=|in|not in)\s*(.+)$", atom)
    if not match:
        raise ValueError(f"unsupported environment marker: {atom!r}")
    name, operator, raw_expected = match.groups()
    expected = raw_expected.strip().strip("\"'")
    if name == "extra":
        return False
    actual = TARGET_MARKER_VALUES.get(name)
    if actual is None:
        raise ValueError(f"unsupported environment marker variable: {name}")
    if operator in {"in", "not in"}:
        choices = {item.strip() for item in expected.split(",")}
        result = actual in choices
        return result if operator == "in" else not result
    if name in {"python_version", "python_full_version"}:
        return satisfies(actual, ((operator, expected),))
    if operator in {"==", "===", "!=", "<=", ">=", "<", ">"}:
        left, right = actual.lower(), expected.lower()
        result = left == right if operator in {"==", "==="} else left != right if operator == "!=" else {
            "<=": left <= right,
            ">=": left >= right,
            "<": left < right,
            ">": left > right,
        }[operator]
        return result
    raise ValueError(f"unsupported marker operator: {operator}")


def requirement_applies(requirement: Requirement) -> bool:
    if not requirement.marker:
        return True
    for disjunction in re.split(r"\s+or\s+", requirement.marker, flags=re.IGNORECASE):
        if all(_marker_atom_applies(atom) for atom in re.split(r"\s+and\s+", disjunction, flags=re.IGNORECASE)):
            return True
    return False


def applicable_requirements(values: Iterable[str]) -> list[Requirement]:
    requirements: list[Requirement] = []
    for value in values:
        requirement = parse_requirement(value)
        if requirement_applies(requirement):
            requirements.append(requirement)
    return requirements


def stable_version_key(value: str) -> tuple[int, ...] | None:
    if re.search(r"(?i)(a|b|rc|dev)", value):
        return None
    match = re.match(r"^(\d+(?:\.\d+)*)(?:\.post(\d+))?(?:\+.*)?$", value)
    if not match:
        return None
    parts = tuple(int(item) for item in match.group(1).split("."))
    post = int(match.group(2) or 0)
    return parts + (post,)


def parse_specifiers(raw_value: str | None) -> tuple[tuple[str, str], ...]:
    if not raw_value:
        return ()
    result: list[tuple[str, str]] = []
    for part in raw_value.split(","):
        match = re.match(r"^\s*(===|==|!=|<=|>=|<|>|~=)\s*([0-9][^,\s]*)\s*$", part)
        if not match:
            raise ValueError(f"unsupported version constraint: {raw_value!r}")
        result.append((match.group(1), match.group(2)))
    return tuple(result)


def _pad(left: tuple[int, ...], right: tuple[int, ...]) -> tuple[tuple[int, ...], tuple[int, ...]]:
    length = max(len(left), len(right))
    return left + (0,) * (length - len(left)), right + (0,) * (length - len(right))


def satisfies(version: str, specifiers: Iterable[tuple[str, str]]) -> bool:
    candidate = stable_version_key(version)
    if candidate is None:
        return False
    for operator, raw_expected in specifiers:
        if raw_expected.endswith(".*") and operator in {"==", "!=", "==="}:
            prefix = tuple(int(item) for item in raw_expected[:-2].split("."))
            matches = candidate[: len(prefix)] == prefix
            if operator == "!=" and matches:
                return False
            if operator in {"==", "==="} and not matches:
                return False
            continue
        if raw_expected.endswith(".*") and operator in {"<", "<=", ">", ">="}:
            # Some published metadata still uses the legacy PEP 440 spelling
            # ``>=5.1.*``. Treat the wildcard bound as its numeric prefix so a
            # valid compatible wheel is not rejected before wheel selection.
            raw_expected = raw_expected[:-2]
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
            raw_parts = tuple(int(item) for item in raw_expected.split(".")[:3])
            if len(raw_parts) <= 1:
                upper = (raw_parts[0] + 1,)
                prefix = ()
            elif len(raw_parts) == 2:
                upper = (raw_parts[0] + 1, 0)
                prefix = raw_parts[:1]
            else:
                upper = raw_parts[:-1] + (raw_parts[-2] + 1,)
                prefix = raw_parts[:-1]
            if candidate >= _pad(upper, candidate)[0] or (prefix and candidate[: len(prefix)] != prefix):
                return False
    return True


def wheel_compatible(filename: str) -> bool:
    lower = filename.lower()
    if not lower.endswith(".whl"):
        return False
    if re.search(r"-(?:py2\.)?py3-none-any\.whl$", lower):
        return True
    if re.search(r"-(?:py2\.)?py3-none-win_amd64\.whl$", lower):
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
        and requires_python_compatible(item.get("requires_python"))
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
        if choose_wheel(files) is not None:
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


def requires_python_compatible(value: str | None) -> bool:
    if not value:
        return True
    try:
        for operator, expected in parse_specifiers(value):
            if expected.endswith(".*") and operator in {"==", "!=", "==="}:
                prefix = tuple(int(part) for part in expected[:-2].split("."))
                matches = TARGET_PYTHON[: len(prefix)] == prefix
                if operator == "!=":
                    matches = not matches
                if not matches:
                    return False
            elif not satisfies("3.12", ((operator, expected),)):
                return False
        return True
    except ValueError:
        return False


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
    requirements = applicable_requirements(project["dependencies"])
    requirements.append(parse_requirement("scikit-learn"))
    requirements.extend(parse_requirement(value) for value in WINDOWS_XPU_RUNTIME_REQUIREMENTS)
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
    filename_name = re.escape(name).replace(r"\-", r"[-_]")
    pattern = re.compile(
        rf"{filename_name}-{decoded_version}-cp312-cp312-win_amd64\.whl",
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


def _combined_requirement(name: str, constraints: Iterable[Requirement]) -> Requirement:
    values = list(constraints)
    specifiers = tuple(sorted({specifier for item in values for specifier in item.specifiers}))
    original = " && ".join(sorted({item.original for item in values}))
    return Requirement(name, specifiers, original or name)


def _select_version(metadata: dict[str, Any], constraints: Iterable[Requirement]) -> str | None:
    requirements = list(constraints)
    candidates: list[tuple[tuple[int, ...], str]] = []
    for version, files in metadata.get("releases", {}).items():
        key = stable_version_key(version)
        if key is None or not files:
            continue
        if not all(satisfies(version, requirement.specifiers) for requirement in requirements):
            continue
        if choose_wheel(files) is not None:
            candidates.append((key, version))
    return max(candidates)[1] if candidates else None


def parse_version_override(value: str) -> tuple[str, str]:
    match = re.fullmatch(r"([A-Za-z0-9_.-]+)==([0-9]+(?:\.[0-9]+)*)", value.strip())
    if not match:
        raise ValueError(f"version override must use NAME==STABLE_VERSION: {value!r}")
    return normalize_name(match.group(1)), match.group(2)


def resolve_requirement(
    client: MetadataClient,
    requirement: Requirement,
    constraints: Iterable[Requirement],
    metadata_cache: dict[tuple[str, str], dict[str, Any]],
    version_overrides: dict[str, str] | None = None,
) -> dict[str, Any]:
    package = requirement.name
    override = (version_overrides or {}).get(package)
    xpu_override = XPU_VERSION_OVERRIDES.get(package)
    if override is not None:
        version = override
        if not all(satisfies(version, item.specifiers) for item in constraints):
            raise ValueError(f"version override {version} does not satisfy all constraints for {package}")
    elif xpu_override is not None:
        version = xpu_override[0]
        if not all(satisfies(version, item.specifiers) for item in constraints):
            raise ValueError(f"fixed XPU version {version} does not satisfy all constraints for {package}")
    else:
        index_key = (package, "")
        metadata = metadata_cache.get(index_key)
        if metadata is None:
            metadata = client.json(f"https://pypi.org/pypi/{package}/json")
            metadata_cache[index_key] = metadata
        version = _select_version(metadata, constraints)
        if version is None:
            raise ValueError(f"no compatible CPython 3.12/Windows wheel satisfies constraints for {package}")

    version_key = (package, version)
    metadata = metadata_cache.get(version_key)
    if xpu_override is not None:
        wheel = find_xpu_wheel(client, package, version + xpu_override[1])
        if package == "pytorch-triton-xpu":
            metadata = {"info": {"requires_dist": [], "requires_python": ">=3.10"}}
        elif metadata is None:
            metadata = client.json(f"https://pypi.org/pypi/{package}/{version}/json")
            metadata_cache[version_key] = metadata
    else:
        if metadata is None:
            metadata = client.json(f"https://pypi.org/pypi/{package}/{version}/json")
            metadata_cache[version_key] = metadata
        wheel = choose_wheel(metadata.get("urls", []))
        wheel = pypi_file_record(wheel) if wheel else None
        if wheel is not None:
            wheel["payload_downloaded"] = False

    requirements = metadata.get("info", {}).get("requires_dist") or []
    result = {
        "name": package,
        "requirement": requirement.original,
        "selected_version": version + (xpu_override[1] if xpu_override is not None else ""),
        "requires_python": metadata.get("info", {}).get("requires_python"),
        "requires_dist": requirements,
        "wheel": wheel,
        "status": "CANDIDATE" if wheel else "NO_COMPATIBLE_CP312_WINDOWS_WHEEL_METADATA",
    }
    if result["status"] != "CANDIDATE":
        raise ValueError(f"no compatible CPython 3.12/Windows wheel metadata for {package} {version}")
    return result


def resolve_dependency_graph(
    client: MetadataClient,
    roots: list[Requirement],
    version_overrides: dict[str, str] | None = None,
) -> tuple[dict[str, dict[str, Any]], dict[str, list[Requirement]], list[dict[str, Any]]]:
    constraints: dict[str, list[Requirement]] = {}
    for root in roots:
        constraints.setdefault(root.name, []).append(root)
    pending = set(constraints)
    selected: dict[str, dict[str, Any]] = {}
    failures: list[dict[str, Any]] = []
    failed_packages: set[str] = set()
    metadata_cache: dict[tuple[str, str], dict[str, Any]] = {}

    while pending:
        package = sorted(pending)[0]
        pending.remove(package)
        if package in failed_packages:
            continue
        package_constraints = constraints[package]
        combined = _combined_requirement(package, package_constraints)
        try:
            record = resolve_requirement(
                client,
                combined,
                package_constraints,
                metadata_cache,
                version_overrides,
            )
        except (MetadataTransportError, MetadataPolicyError, ValueError) as error:
            selected.pop(package, None)
            failed_packages.add(package)
            failures.append({
                "package": package,
                "constraints": [item.original for item in package_constraints],
                "error": str(error),
            })
            continue

        previous_version = selected.get(package, {}).get("selected_version")
        selected[package] = record
        if previous_version == record["selected_version"] and package not in pending:
            continue
        for raw_dependency in record.get("requires_dist", []):
            dependency = parse_requirement(raw_dependency)
            if not requirement_applies(dependency):
                continue
            existing = constraints.setdefault(dependency.name, [])
            if dependency.original not in {item.original for item in existing}:
                existing.append(dependency)
                pending.add(dependency.name)

    return selected, constraints, failures


def load_authorization_gate(path: Path) -> dict[str, Any]:
    from validate_gate import validate_gate_document

    with path.open("r", encoding="utf-8") as stream:
        gate = json.load(stream)
    validate_gate_document(
        gate,
        expected_gate_id=GATE_ID,
        required_actions=REQUIRED_GATE_ACTIONS,
    )
    hosts = set(gate.get("allowed_hosts", []))
    if hosts != ALLOWED_HOSTS:
        raise MetadataPolicyError("G1-METADATA-2 host allowlist does not match the resolver policy")
    if set(gate.get("allowed_methods", [])) != ALLOWED_METHODS:
        raise MetadataPolicyError("G1-METADATA-2 method allowlist does not match the resolver policy")
    return gate


def build_lock(gate_path: Path, version_overrides: dict[str, str] | None = None) -> dict[str, Any]:
    gate = load_authorization_gate(gate_path)
    client = MetadataClient(set(gate["allowed_hosts"]))
    python_identity = resolve_python_identity(client)
    llamafactory, requirements = load_llamafactory_metadata(client)
    selected, constraints, failures = resolve_dependency_graph(client, requirements, version_overrides)
    direct: list[dict[str, Any]] = []
    for requirement in requirements:
        item = selected.get(requirement.name)
        if item is None:
            failures.append({
                "package": requirement.name,
                "constraints": [requirement.original],
                "error": "root requirement was not resolved",
            })
            continue
        direct_item = dict(item)
        direct_item["requirement"] = requirement.original
        direct.append(direct_item)

    all_wheel_bytes = sum(
        int(item["wheel"]["size_bytes"])
        for item in selected.values()
        if item.get("wheel") and item["wheel"].get("size_bytes") is not None
    )
    direct_names = {item.name for item in requirements}
    unresolved = sorted(set(constraints) - set(selected))
    transitive_names = sorted(set(constraints) - direct_names)
    python_bytes = int(python_identity.get("asset_size_bytes") or 0)
    digest_missing = python_identity.get("asset_digest") is None
    lock_status = "COMPLETE_METADATA_ONLY_LOCK" if not failures and not unresolved else "INCOMPLETE_METADATA_ONLY_LOCK"
    blockers = [
        "Installed disk size cannot be proven from compressed artifact metadata alone.",
    ]
    if digest_missing:
        blockers.append("The Python release API did not provide a cryptographic asset digest.")
    if failures:
        blockers.append("One or more metadata requests or parsers failed; see resolution_failures.")
    if unresolved:
        blockers.append("Some dependency constraints remain unresolved: " + ", ".join(unresolved))

    override_suffix = "-".join(
        f"{name}-{version}" for name, version in sorted((version_overrides or {}).items())
    )
    lock_id = "runtime-metadata-lock-g1-metadata-2" + (f"-{override_suffix}" if override_suffix else "")
    return {
        "lock_id": lock_id,
        "generated_mode": "AUTHORIZED_METADATA_ONLY",
        "authorization_gate": GATE_ID,
        "authorization_gate_sha256": sha256_file(gate_path),
        "network_methods_used": sorted({item["method"] for item in client.requests}),
        "payload_downloads_performed": False,
        "environment_created": False,
        "packages_installed": False,
        "python": python_identity,
        "llamafactory": llamafactory,
        "version_overrides": dict(sorted((version_overrides or {}).items())),
        "direct_requirements": direct,
        "resolved_requirements": [selected[name] for name in sorted(selected)],
        "transitive_requirement_names": transitive_names,
        "transitive_requirement_count": len(transitive_names),
        "unresolved_requirement_names": unresolved,
        "resolution_failures": failures,
        "size_evidence": {
            "python_archive_bytes": python_bytes or None,
            "direct_wheel_archives_bytes": sum(
                int(item["wheel"]["size_bytes"])
                for item in direct
                if item.get("wheel") and item["wheel"].get("size_bytes") is not None
            ),
            "resolved_wheel_archives_bytes": all_wheel_bytes,
            "known_direct_transfer_bytes": python_bytes + all_wheel_bytes,
            "complete_download_bytes": python_bytes + all_wheel_bytes if not failures and not unresolved else None,
            "source_tree_blob_bytes": llamafactory["source_tree_blob_bytes"],
            "complete_cache_bytes": None,
            "installed_bytes": None,
        },
        "lock_status": lock_status,
        "blockers_before_g1_op": blockers,
        "request_log": client.requests,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gate", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--version-override",
        action="append",
        default=[],
        metavar="NAME==VERSION",
        help="pin a package to an exact stable version for this metadata-only proposal",
    )
    arguments = parser.parse_args()
    overrides: dict[str, str] = {}
    for raw_override in arguments.version_override:
        name, version = parse_version_override(raw_override)
        if name in overrides and overrides[name] != version:
            raise ValueError(f"conflicting version overrides for {name}")
        overrides[name] = version
    lock = build_lock(arguments.gate, overrides)
    write_json_new(arguments.output, lock)
    print(arguments.output.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
