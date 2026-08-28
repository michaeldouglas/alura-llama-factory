"""Path protections for heavy and generated experiment artifacts."""

from __future__ import annotations

import os
from pathlib import Path


class PathPolicyError(ValueError):
    """Raised when an artifact path violates experiment policy."""


def _normalized(path: str | Path) -> Path:
    return Path(path).expanduser().resolve(strict=False)


def _is_within(candidate: Path, parent: Path) -> bool:
    try:
        candidate.relative_to(parent)
        return True
    except ValueError:
        return False


def validate_heavy_artifact_path(
    candidate: str | Path,
    *,
    repository_root: str | Path,
    approved_external_root: str | Path,
    require_new: bool = True,
) -> Path:
    """Require a narrow, external, approved and optionally new artifact path."""
    target = _normalized(candidate)
    repo = _normalized(repository_root)
    approved = _normalized(approved_external_root)

    broad_targets = {Path(target.anchor), Path.home().resolve(strict=False), repo, approved}
    if target in broad_targets:
        raise PathPolicyError(f"broad artifact target is prohibited: {target}")
    if _is_within(target, repo):
        raise PathPolicyError(f"heavy artifact path is inside repository: {target}")
    if not _is_within(target, approved):
        raise PathPolicyError(f"artifact path is outside approved root: {target}")
    if require_new and target.exists():
        raise FileExistsError(f"artifact path already exists: {target}")
    return target


def approved_root_from_environment(feature_id: str) -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if not local_app_data:
        raise PathPolicyError("LOCALAPPDATA is unavailable; no fallback path is allowed")
    return _normalized(Path(local_app_data) / "alura-llama-factory" / feature_id)
