"""Simple SMA crossover strategy."""

from __future__ import annotations

from collections import deque
from typing import Deque, Optional

from backend.models.trade import Order, OrderSide
from backend.strategies.base_strategy import BaseStrategy


class SMACrossoverStrategy(BaseStrategy):
    def __init__(self, symbol: str, fast: int = 10, slow: int = 30, quantity: float = 1.0) -> None:
        super().__init__(symbol, quantity)
        if fast <= 0 or slow <= 0 or fast >= slow:
            raise ValueError("Invalid SMA window sizes")
        self.fast_window = fast
        self.slow_window = slow
        self.fast_values: Deque[float] = deque(maxlen=fast)
        self.slow_values: Deque[float] = deque(maxlen=slow)
        self.last_signal: Optional[str] = None

    def _sma(self, values: Deque[float]) -> Optional[float]:
        return sum(values) / len(values) if len(values) == values.maxlen else None

    def generate_signal(self, market_price: float) -> Optional[Order]:
        self.fast_values.append(market_price)
        self.slow_values.append(market_price)
        fast_sma = self._sma(self.fast_values)
        slow_sma = self._sma(self.slow_values)
        if fast_sma is None or slow_sma is None:
            return None
        if fast_sma > slow_sma and self.last_signal != "buy":
            self.last_signal = "buy"
            return Order(symbol=self.symbol, side=OrderSide.BUY, quantity=self.quantity, price=market_price)
        if fast_sma < slow_sma and self.last_signal != "sell":
            self.last_signal = "sell"
            return Order(symbol=self.symbol, side=OrderSide.SELL, quantity=self.quantity, price=market_price)
        return None


