"""RSI-based mean-reversion strategy."""

from __future__ import annotations

from collections import deque
from typing import Deque, Optional

from backend.models.trade import Order, OrderSide
from backend.strategies.base_strategy import BaseStrategy


def compute_rsi(values: Deque[float], period: int) -> Optional[float]:
    if len(values) < period + 1:
        return None
    gains = 0.0
    losses = 0.0
    for i in range(1, period + 1):
        delta = values[-i] - values[-i - 1]
        if delta > 0:
            gains += delta
        else:
            losses -= delta
    if gains == 0 and losses == 0:
        return 50.0
    rs = (gains / period) / (losses / period if losses != 0 else 1e-9)
    return 100 - (100 / (1 + rs))


class RSIStrategy(BaseStrategy):
    def __init__(self, symbol: str, period: int = 14, oversold: float = 30.0, overbought: float = 70.0, quantity: float = 1.0) -> None:
        super().__init__(symbol, quantity)
        if period <= 1:
            raise ValueError("RSI period must be > 1")
        self.period = period
        self.oversold = oversold
        self.overbought = overbought
        self.values: Deque[float] = deque(maxlen=period + 1)

    def generate_signal(self, market_price: float) -> Optional[Order]:
        self.values.append(market_price)
        rsi = compute_rsi(self.values, self.period)
        if rsi is None:
            return None
        if rsi <= self.oversold:
            return Order(symbol=self.symbol, side=OrderSide.BUY, quantity=self.quantity, price=market_price)
        if rsi >= self.overbought:
            return Order(symbol=self.symbol, side=OrderSide.SELL, quantity=self.quantity, price=market_price)
        return None


