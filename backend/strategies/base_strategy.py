"""Strategy base class and simple example strategy interface."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from backend.models.trade import Order, OrderSide


class BaseStrategy(ABC):
    """Abstract base for trading strategies.

    Concrete strategies should implement `generate_signal`.
    """

    def __init__(self, symbol: str, quantity: float = 1.0) -> None:
        self.symbol = symbol
        self.quantity = quantity

    @abstractmethod
    def generate_signal(self, market_price: float) -> Optional[Order]:
        """Return an order or None based on the current market price."""


class ThresholdStrategy(BaseStrategy):
    """Very simple strategy: buy below `buy_below`, sell above `sell_above`."""

    def __init__(self, symbol: str, buy_below: float, sell_above: float, quantity: float = 1.0) -> None:
        super().__init__(symbol, quantity)
        self.buy_below = buy_below
        self.sell_above = sell_above

    def generate_signal(self, market_price: float) -> Optional[Order]:
        if market_price <= self.buy_below:
            return Order(symbol=self.symbol, side=OrderSide.BUY, quantity=self.quantity, price=market_price)
        if market_price >= self.sell_above:
            return Order(symbol=self.symbol, side=OrderSide.SELL, quantity=self.quantity, price=market_price)
        return None


