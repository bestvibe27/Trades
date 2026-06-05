"""Drawdown monitoring and control helpers."""

from __future__ import annotations

from typing import List


def max_drawdown(equity_curve: List[float]) -> float:
    """Compute maximum drawdown for an equity curve.

    Returns a negative value representing the worst peak-to-trough loss.
    """
    if not equity_curve:
        return 0.0
    peak = equity_curve[0]
    max_dd = 0.0
    for value in equity_curve:
        if value > peak:
            peak = value
        drawdown = (value - peak) / peak if peak != 0 else 0.0
        if drawdown < max_dd:
            max_dd = drawdown
    return max_dd


