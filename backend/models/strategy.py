"""Strategy configuration models."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict


@dataclass
class StrategyConfig:
    name: str
    symbol: str
    parameters: Dict[str, float]


