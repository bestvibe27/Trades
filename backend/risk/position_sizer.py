"""Position sizing utilities."""

from __future__ import annotations


def fixed_fractional(account_equity: float, risk_fraction: float, stop_distance: float) -> float:
    """Calculate position size using fixed-fractional method.

    Args:
        account_equity: Current account equity.
        risk_fraction: Fraction of equity to risk (e.g., 0.01 for 1%).
        stop_distance: Distance between entry and stop price.

    Returns:
        Quantity to trade.
    """
    if account_equity <= 0 or risk_fraction <= 0 or stop_distance <= 0:
        return 0.0
    risk_amount = account_equity * risk_fraction
    return risk_amount / stop_distance


