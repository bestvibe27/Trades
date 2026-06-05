"""Risk manager coordinating sizing and limits."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RiskLimits:
    max_drawdown: float = -0.2  # -20%
    per_trade_risk: float = 0.01  # 1%
    max_positions: int = 10


class RiskManager:
    """Enforce basic global risk limits."""

    def __init__(self, limits: RiskLimits | None = None) -> None:
        self.limits = limits or RiskLimits()

    def can_open_new_position(self, current_positions: int) -> bool:
        return current_positions < self.limits.max_positions


