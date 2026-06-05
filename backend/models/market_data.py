"""Models for market data entities used across the system."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import List


@dataclass
class Candle:
    symbol: str
    timeframe: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    timestamp: datetime


@dataclass
class Tick:
    symbol: str
    bid: float
    ask: float
    timestamp: datetime


@dataclass
class Quote:
    symbol: str
    price: float
    timestamp: datetime


@dataclass
class CandleSeries:
    symbol: str
    timeframe: str
    candles: List[Candle]


