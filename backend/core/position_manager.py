"""Position manager utility for retrieving exposure."""

from __future__ import annotations

from typing import Dict

from backend.models.trade import Position


class PositionManager:
    def __init__(self) -> None:
        self.positions: Dict[str, Position] = {}

    def exposure(self) -> float:
        return sum(abs(p.quantity * p.avg_price) for p in self.positions.values())


