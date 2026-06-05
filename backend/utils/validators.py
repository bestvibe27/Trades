"""Input validation helpers."""

from __future__ import annotations


def ensure_positive(value: float, name: str) -> float:
    if value <= 0:
        raise ValueError(f"{name} must be positive")
    return value


def ensure_non_empty(value: str, name: str) -> str:
    if not value:
        raise ValueError(f"{name} must be non-empty")
    return value


