"""Abstract data provider and simple mock implementation."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from hashlib import md5
from math import sin
from typing import List, Optional

from backend.models.market_data import Candle, CandleSeries

_TF_MINUTES = {
    "1m": 1, "3m": 3, "5m": 5, "15m": 15, "30m": 30,
    "1h": 60, "2h": 120, "4h": 240, "6h": 360, "12h": 720,
    "1d": 1440, "1w": 10080, "1M": 43200,
    "M1": 1, "M3": 3, "M5": 5, "M15": 15, "M30": 30,
    "H1": 60, "H2": 120, "H4": 240, "H6": 360, "H12": 720,
    "D1": 1440, "W1": 10080, "MN1": 43200,
}

_SYMBOL_BASE = {
    "EURUSDm": 1.0950, "EURUSD": 1.0950,
    "GBPUSDm": 1.2750, "GBPUSD": 1.2750,
    "USDJPYm": 149.50, "USDJPY": 149.50,
    "XAUUSDm": 2025.50, "XAUUSD": 2025.50,
    "BTCUSDm": 62785.0, "BTCUSD": 62785.0, "BTCUSDT": 62785.0,
    "ETHUSDm": 2650.0, "ETHUSD": 2650.0, "ETHUSDT": 2650.0,
}


class DataProvider(ABC):
    @abstractmethod
    def get_historical_candles(
        self,
        symbol: str,
        timeframe: str,
        limit: int = 100,
        before: Optional[datetime] = None,
    ) -> CandleSeries:
        raise NotImplementedError


class MockDataProvider(DataProvider):
    """Generates synthetic historical candle data for development and tests."""

    def get_historical_candles(
        self,
        symbol: str,
        timeframe: str,
        limit: int = 100,
        before: Optional[datetime] = None,
    ) -> CandleSeries:
        minutes = _TF_MINUTES.get(timeframe) or _TF_MINUTES.get(timeframe.lower()) or 1
        end = before or datetime.now(timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        # Align to bar boundary; step one bar earlier when paginating so we
        # don't re-emit the candle that ends exactly at `before`.
        epoch = int(end.timestamp())
        step = minutes * 60
        end_epoch = epoch - (epoch % step)
        if before is not None:
            end_epoch -= step

        base = float(_SYMBOL_BASE.get(symbol, _SYMBOL_BASE.get(symbol.replace("m", ""), 100.0)))
        seed = int(md5(symbol.encode()).hexdigest()[:8], 16)

        candles: List[Candle] = []
        price = base
        raw = []
        for i in range(limit):
            t = end_epoch - i * step
            n = ((seed + i * 1103515245) & 0x7FFFFFFF) / 0x7FFFFFFF
            drift = sin((seed % 97) + i / 7.0) * 0.0015 * base
            change = (n - 0.5) * 0.004 * base + drift
            close = max(base * 0.01, price)
            open_ = max(base * 0.01, close - change)
            wick = abs(change) * (0.35 + n * 0.4) + base * 0.0002
            high = max(open_, close) + wick
            low = min(open_, close) - wick
            volume = 50 + n * 200
            raw.append(
                Candle(
                    symbol=symbol,
                    timeframe=timeframe,
                    open=round(open_, 8),
                    high=round(high, 8),
                    low=round(low, 8),
                    close=round(close, 8),
                    volume=round(volume, 2),
                    timestamp=datetime.fromtimestamp(t, tz=timezone.utc),
                )
            )
            price = open_

        raw.reverse()
        if raw:
            offset = base - raw[-1].close
            candles = [
                Candle(
                    symbol=c.symbol,
                    timeframe=c.timeframe,
                    open=round(c.open + offset, 8),
                    high=round(c.high + offset, 8),
                    low=round(c.low + offset, 8),
                    close=round(c.close + offset, 8),
                    volume=c.volume,
                    timestamp=c.timestamp,
                )
                for c in raw
            ]
        return CandleSeries(symbol=symbol, timeframe=timeframe, candles=candles)
