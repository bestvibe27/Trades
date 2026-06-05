"""Market data feed interface and a simple polling stub."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Callable


class MarketFeed(ABC):
    @abstractmethod
    def subscribe_price(self, symbol: str, callback: Callable[[float], None]) -> None:
        raise NotImplementedError


class PollingFeed(MarketFeed):
    """Stub feed that can be wired to an external poller by the app."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[Callable[[float], None]]] = {}

    def subscribe_price(self, symbol: str, callback: Callable[[float], None]) -> None:
        self._subscribers.setdefault(symbol, []).append(callback)

    def push_price(self, symbol: str, price: float) -> None:
        for cb in self._subscribers.get(symbol, []):
            cb(price)


