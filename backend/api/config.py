"""API configuration models and loader.

Centralizes environment and YAML-based configuration for the backend.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List, Optional


@dataclass(frozen=True)
class APISettings:
    """Immutable API settings.

    Attributes:
        host: Bind host for the API server.
        port: Bind port for the API server.
        cors_origins: Allowed CORS origins.
        log_level: Logging level, one of {DEBUG, INFO, WARNING, ERROR}.
    """

    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: List[str] = None  # type: ignore[assignment]
    log_level: str = "INFO"


def load_settings() -> APISettings:
    """Load settings from environment variables.

    Returns:
        APISettings: Loaded settings object.
    """
    cors_raw: Optional[str] = os.getenv("CORS_ORIGINS")
    cors_list = [o.strip() for o in cors_raw.split(",")] if cors_raw else ["*"]
    return APISettings(
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        cors_origins=cors_list,
        log_level=os.getenv("LOG_LEVEL", "INFO"),
    )


