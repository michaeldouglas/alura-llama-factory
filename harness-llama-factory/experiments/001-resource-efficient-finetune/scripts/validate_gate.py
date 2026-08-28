"""Fail-closed validation for experiment gate records."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, Mapping, Any


class GateValidationError(ValueError):
    """Raised when authorization is absent, stale or too narrow."""


def validate_gate_document(
    document: Mapping[str, Any],
    *,
    expected_gate_id: str,
    required_actions: Iterable[str],
    expected_scope_hash: str | None = None,
) -> None:
    if document.get("gate_id") != expected_gate_id:
        raise GateValidationError("gate identity mismatch")
    if document.get("decision") != "APPROVED":
        raise GateValidationError("gate is not approved")
    if document.get("superseded") is True or document.get("revoked") is True:
        raise GateValidationError("gate has been superseded or revoked")
    if expected_scope_hash is not None and document.get("scope_hash") != expected_scope_hash:
        raise GateValidationError("gate scope hash is stale or mismatched")
    authorized = set(document.get("authorized_actions", []))
    missing = sorted(set(required_actions) - authorized)
    if missing:
        raise GateValidationError(f"actions are not authorized: {', '.join(missing)}")


def validate_gate_file(
    path: str | Path,
    *,
    expected_gate_id: str,
    required_actions: Iterable[str],
    expected_scope_hash: str | None = None,
) -> None:
    target = Path(path)
    if not target.is_file():
        raise GateValidationError(f"gate record is absent: {target}")
    with target.open("r", encoding="utf-8") as stream:
        document = json.load(stream)
    validate_gate_document(
        document,
        expected_gate_id=expected_gate_id,
        required_actions=required_actions,
        expected_scope_hash=expected_scope_hash,
    )
