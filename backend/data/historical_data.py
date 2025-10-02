"""Historical data utilities built on top of providers."""

from __future__ import annotations

from typing import Iterable, List

from backend.data.data_provider import DataProvider
from backend.models.market_data import Candle, CandleSeries
from backend.utils.indicators import simple_moving_average


def compute_sma_series(provider: DataProvider, symbol: str, timeframe: str, window: int, limit: int = 100) -> List[float | None]:
    series: CandleSeries = provider.get_historical_candles(symbol, timeframe, limit=limit)
    closes: Iterable[float] = (c.close for c in series.candles)
    return simple_moving_average(closes, window)


