"""Portfolio manager tracking equity and allocations."""

from __future__ import annotations


class PortfolioManager:
    def __init__(self, starting_equity: float = 100000.0) -> None:
        self.equity = starting_equity

    def apply_pnl(self, pnl: float) -> None:
        self.equity += pnl


