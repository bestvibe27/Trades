"""Abstract data provider and simple mock implementation."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from random import random
from typing import List

from backend.models.market_data import Candle, CandleSeries


class DataProvider(ABC):
    @abstractmethod
    def get_historical_candles(self, symbol: str, timeframe: str, limit: int = 100) -> CandleSeries:
        raise NotImplementedError


class MockDataProvider(DataProvider):
    """Generates synthetic historical candle data for development and tests."""

    def get_historical_candles(self, symbol: str, timeframe: str, limit: int = 100) -> CandleSeries:
        now = datetime.now(timezone.utc)
        candles: List[Candle] = []
        price = 100.0
        for i in range(limit):
            # create pseudo-random walk
            change = (random() - 0.5) * 2.0
            open_ = price
            close = max(1.0, open_ + change)
            high = max(open_, close) + random()
            low = max(0.1, min(open_, close) - random())
            volume = 100 + random() * 50
            ts = now - timedelta(minutes=i)
            candles.append(Candle(symbol=symbol, timeframe=timeframe, open=open_, high=high, low=low, close=close, volume=volume, timestamp=ts))
            price = close
        candles.reverse()
        return CandleSeries(symbol=symbol, timeframe=timeframe, candles=candles)


