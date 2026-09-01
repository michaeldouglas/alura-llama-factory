"""Retrieve one pinned model revision with fail-closed metadata, size and hash checks."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from manifest_utils import sha256_file, write_json_new


ROOT = Path(__file__).resolve().parents[3]
GATE_PATH = ROOT / "experiments/001-resource-efficient-finetune/manifests/gates/g2-op.json"
OUTPUT_PATH = ROOT / "experiments/001-resource-efficient-finetune/manifests/model-source.json"
MODEL_REPOSITORY = "Qwen/Qwen2.5-0.5B-Instruct"
MODEL_REVISION = "7ae557604adf67be50417f59c2c2f167def9a775"
EXPECTED_LICENSE_MARKER = b"Apache License"


class RetrievalError(RuntimeError):
    """Raised when the approved source or payload does not match exactly."""


class AllowlistedRedirectHandler(urllib.request.HTTPRedirectHandler):
    def __init__(self, allowed_hosts: set[str]) -> None:
        super().__init__()
        self.allowed_hosts = allowed_hosts

    def redirect_request(self, req: urllib.request.Request, fp: Any, code: int, msg: str, headers: Any, newurl: str) -> urllib.request.Request:
        validate_url(newurl, self.allowed_hosts, method="GET")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def validate_url(url: str, allowed_hosts: set[str], *, method: str) -> None:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in allowed_hosts:
        raise RetrievalError(f"URL host or scheme is not approved: {url}")
    if method not in {"GET", "HEAD"}:
        raise RetrievalError(f"HTTP method is not approved: {method}")


def read_json(url: str, allowed_hosts: set[str]) -> Any:
    validate_url(url, allowed_hosts, method="GET")
    opener = urllib.request.build_opener(AllowlistedRedirectHandler(allowed_hosts))
    request = urllib.request.Request(url, method="GET", headers={"User-Agent": "alura-llama-factory-g2-op/1.0"})
    with opener.open(request, timeout=60) as response:
        validate_url(response.geturl(), allowed_hosts, method="GET")
        return json.load(response)


def load_gate() -> dict[str, Any]:
    if not GATE_PATH.is_file():
        raise RetrievalError(f"G2-OP gate is absent: {GATE_PATH}")
    with GATE_PATH.open("r", encoding="utf-8") as stream:
        gate = json.load(stream)
    required_actions = {
        "retrieve_pinned_model_source",
        "verify_model_metadata",
        "verify_model_file_sizes",
        "verify_model_file_hashes",
        "write_model_source_manifest",
    }
    if gate.get("gate_id") != "G2-OP" or gate.get("decision") != "APPROVED":
        raise RetrievalError("G2-OP is absent or not approved")
    missing = sorted(required_actions - set(gate.get("authorized_actions", [])))
    if missing:
        raise RetrievalError(f"G2-OP actions are missing: {', '.join(missing)}")
    if gate.get("repository_id") != MODEL_REPOSITORY or gate.get("revision_sha") != MODEL_REVISION:
        raise RetrievalError("G2-OP source identity does not match the pinned model")
    if OUTPUT_PATH.exists():
        raise RetrievalError(f"refusing to overwrite model manifest: {OUTPUT_PATH}")
    return gate


def verify_metadata(gate: dict[str, Any], metadata: list[dict[str, Any]]) -> list[dict[str, Any]]:
    expected = {item["path"]: item for item in gate["expected_files"]}
    observed = {item.get("path"): item for item in metadata if item.get("type") == "file"}
    if set(observed) != set(expected):
        raise RetrievalError(f"model file set mismatch: expected {sorted(expected)}, got {sorted(observed)}")
    for path, item in expected.items():
        actual = observed[path]
        if actual.get("size") != item["size"] or actual.get("oid") != item["metadata_oid"]:
            raise RetrievalError(f"model metadata mismatch for {path}")
    total = sum(int(item["size"]) for item in expected.values())
    if total != gate["expected_download_bytes"]:
        raise RetrievalError(f"model total size mismatch: expected {gate['expected_download_bytes']}, got {total}")
    return [expected[path] for path in sorted(expected)]


def validate_curl_redirects(url: str, allowed_hosts: set[str]) -> None:
    result = subprocess.run(
        ["curl.exe", "--head", "--location", "--silent", "--show-error", "--max-time", "60", url],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RetrievalError(f"curl HEAD redirect preflight failed: {result.stderr.strip()}")
    for line in result.stdout.splitlines():
        if line.lower().startswith("location:"):
            validate_url(line.split(":", 1)[1].strip(), allowed_hosts, method="GET")


def download_file(url: str, destination: Path, expected_size: int, allowed_hosts: set[str]) -> str:
    validate_url(url, allowed_hosts, method="GET")
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination.parent, prefix=f".{destination.name}.", suffix=".part", delete=False) as stream:
            temp_path = Path(stream.name)
        if expected_size >= 100_000_000:
            validate_curl_redirects(url, allowed_hosts)
            result = subprocess.run(
                [
                    "curl.exe", "--fail", "--location", "--proto", "=https", "--proto-redir", "=https",
                    "--retry", "2", "--connect-timeout", "30", "--max-time", "1800",
                    "--output", str(temp_path), url,
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode != 0:
                raise RetrievalError(f"curl payload download failed: {result.stderr.strip()}")
        else:
            opener = urllib.request.build_opener(AllowlistedRedirectHandler(allowed_hosts))
            request = urllib.request.Request(url, method="GET", headers={"User-Agent": "alura-llama-factory-g2-op/1.0"})
            with opener.open(request, timeout=120) as response:
                validate_url(response.geturl(), allowed_hosts, method="GET")
                content_length = response.headers.get("Content-Length")
                if content_length is not None and int(content_length) != expected_size:
                    raise RetrievalError(f"Content-Length mismatch for {destination.name}")
                with temp_path.open("wb") as stream:
                    while True:
                        chunk = response.read(8 * 1024 * 1024)
                        if not chunk:
                            break
                        stream.write(chunk)
        byte_count = temp_path.stat().st_size
        if byte_count != expected_size:
            raise RetrievalError(f"download size mismatch for {destination.name}: expected {expected_size}, got {byte_count}")
        if destination.exists():
            raise RetrievalError(f"refusing to overwrite existing model file: {destination}")
        os.replace(temp_path, destination)
        temp_path = None
        return sha256_file(destination)
    finally:
        if temp_path is not None and temp_path.exists():
            temp_path.unlink()


def main() -> int:
    gate = load_gate()
    allowed_hosts = set(gate["allowed_hosts"])
    metadata_url = gate["metadata_url"]
    metadata = read_json(metadata_url, allowed_hosts)
    expected_files = verify_metadata(gate, metadata)
    local_app_data = os.environ.get("LOCALAPPDATA")
    if not local_app_data:
        raise RetrievalError("LOCALAPPDATA is unavailable; no fallback cache is allowed")
    cache_path = Path(gate["cache_path"].replace("%LOCALAPPDATA%", local_app_data)).resolve()
    repo_path = ROOT.resolve()
    if repo_path == cache_path or repo_path in cache_path.parents:
        raise RetrievalError(f"model cache is inside the repository: {cache_path}")
    if cache_path.exists() and not cache_path.is_dir():
        raise RetrievalError(f"model cache path is not a directory: {cache_path}")
    if not cache_path.exists():
        cache_path.mkdir(parents=True, exist_ok=False)
    else:
        expected_paths = {item["path"] for item in expected_files}
        for existing in cache_path.rglob("*"):
            if not existing.is_file():
                continue
            relative = existing.relative_to(cache_path).as_posix()
            if existing.name.endswith(".part"):
                existing.unlink()
            elif relative not in expected_paths:
                raise RetrievalError(f"unexpected existing cache file: {existing}")

    file_manifest: list[dict[str, Any]] = []
    for item in expected_files:
        destination = cache_path / item["path"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        url = f"https://huggingface.co/{MODEL_REPOSITORY}/resolve/{MODEL_REVISION}/{urllib.parse.quote(item['path'], safe='/')}?download=true"
        if destination.exists():
            if destination.stat().st_size != int(item["size"]):
                raise RetrievalError(f"existing cache file size mismatch for {item['path']}")
            digest = sha256_file(destination)
        else:
            digest = download_file(url, destination, int(item["size"]), allowed_hosts)
        expected_sha256 = item.get("expected_sha256")
        if expected_sha256 is not None and digest != expected_sha256:
            raise RetrievalError(f"SHA-256 mismatch for {item['path']}")
        file_manifest.append({
            "path": item["path"],
            "size_bytes": int(item["size"]),
            "sha256": digest,
            "metadata_oid": item["metadata_oid"],
            "url": url,
        })
    license_bytes = (cache_path / "LICENSE").read_bytes()
    if EXPECTED_LICENSE_MARKER not in license_bytes:
        raise RetrievalError("retrieved LICENSE does not contain the expected Apache marker")
    free_bytes_after = shutil.disk_usage(cache_path.anchor).free
    if free_bytes_after < int(gate["storage_policy"]["minimum_free_bytes_after"]):
        raise RetrievalError("free space crossed the approved post-retrieval threshold")
    manifest = {
        "repository_id": MODEL_REPOSITORY,
        "revision_sha": MODEL_REVISION,
        "license_id": gate["license_id"],
        "parameter_count": gate["parameter_count"],
        "approval_state": "APPROVED_RETRIEVED",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "cache_path": str(cache_path),
        "metadata_url": metadata_url,
        "allowed_hosts": sorted(allowed_hosts),
        "expected_download_bytes": gate["expected_download_bytes"],
        "retrieved_bytes": sum(item["size_bytes"] for item in file_manifest),
        "file_count": len(file_manifest),
        "file_manifest": file_manifest,
        "license_verified": True,
        "model_retrieved": True,
        "dataset_retrieved": False,
        "data_prepared": False,
        "inference_run": False,
        "training_run": False,
        "free_bytes_after": free_bytes_after,
    }
    write_json_new(OUTPUT_PATH, manifest)
    print(OUTPUT_PATH)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RetrievalError, urllib.error.URLError, OSError, ValueError) as error:
        print(f"G2-OP STOP: {error}", file=sys.stderr)
        raise SystemExit(2)
