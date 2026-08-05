"""Kraken REST Market Data Provider.

Fetches live historical OHLC candle data from Kraken's public REST API
with exponential backoff retries and dynamic symbol resolution.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
import urllib.request
import urllib.parse
import json

from backend.data.data_provider import DataProvider
from backend.models.market_data import Candle, CandleSeries

logger = logging.getLogger(__name__)

_TF_TO_KRAKEN_MINUTES: Dict[str, int] = {
    "1m": 1, "M1": 1,
    "3m": 3, "M3": 3,
    "5m": 5, "M5": 5,
    "15m": 15, "M15": 15,
    "30m": 30, "M30": 30,
    "1h": 60, "1H": 60, "H1": 60,
    "2h": 120, "2H": 120, "H2": 120,
    "4h": 240, "4H": 240, "H4": 240,
    "6h": 360, "6H": 360, "H6": 360,
    "12h": 720, "12H": 720, "H12": 720,
    "1d": 1440, "1D": 1440, "D1": 1440,
    "1w": 10080, "1W": 10080, "W1": 10080,
    "1M": 21600, "MN1": 21600,
}

_SYMBOL_MAP: Dict[str, str] = {
    "BTCUSD": "XXBTZUSD",
    "BTCUSDT": "XBTUSDT",
    "ETHUSD": "XETHZUSD",
    "ETHUSDT": "ETHUSDT",
    "EURUSD": "EURUSD",
    "GBPUSD": "GBPUSD",
    "USDJPY": "USDJPY",
    "XAUUSD": "XAUUSD",
    "XBTUSD": "XXBTZUSD",
    "BTCUSDm": "XXBTZUSD",
    "ETHUSDm": "XETHZUSD",
    "EURUSDm": "EURUSD",
}


class KrakenDataProvider(DataProvider):
    """Fetches real market OHLC data from Kraken public REST API."""

    def __init__(self, base_url: str = "https://api.kraken.com/0/public"):
        self.base_url = base_url
        self._asset_pairs: Optional[Dict[str, str]] = None
        self._last_pairs_fetch: float = 0

    def _resolve_pair(self, symbol: str) -> str:
        clean = symbol.replace("m", "").upper()
        if clean in _SYMBOL_MAP:
            return _SYMBOL_MAP[clean]
        
        # Try dynamic asset pairs lookup if cached pairs available
        if self._asset_pairs and clean in self._asset_pairs:
            return self._asset_pairs[clean]

        return clean

    def fetch_asset_pairs(self) -> Dict[str, str]:
        """Fetch asset pairs mapping from Kraken REST API."""
        now = time.time()
        if self._asset_pairs and (now - self._last_pairs_fetch < 3600):
            return self._asset_pairs

        url = f"{self.base_url}/AssetPairs"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Trades-App/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if not data.get("error") and "result" in data:
                    mapping = {}
                    for pair_key, info in data["result"].items():
                        altname = info.get("altname", "")
                        wsname = info.get("wsname", "")
                        if altname:
                            mapping[altname.upper()] = pair_key
                        if wsname:
                            mapping[wsname.replace("/", "").upper()] = pair_key
                    self._asset_pairs = mapping
                    self._last_pairs_fetch = now
                    return mapping
        except Exception as e:
            logger.warning("Failed to fetch Kraken AssetPairs: %s", e)

        return _SYMBOL_MAP

    def _http_get_with_retry(self, url: str, max_retries: int = 3) -> dict:
        backoff = 0.5
        last_error = None

        for attempt in range(max_retries):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Trades-App/1.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    errors = data.get("error", [])
                    if errors:
                        err_msg = ", ".join(errors)
                        if "Rate limit exceeded" in err_msg and attempt < max_retries - 1:
                            time.sleep(backoff)
                            backoff *= 2
                            continue
                        raise RuntimeError(f"Kraken API error: {err_msg}")
                    return data
            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    time.sleep(backoff)
                    backoff *= 2

        raise RuntimeError(f"Failed to fetch market data after {max_retries} attempts: {last_error}")

    def get_historical_candles(
        self,
        symbol: str,
        timeframe: str,
        limit: int = 200,
        before: Optional[datetime] = None,
    ) -> CandleSeries:
        pair = self._resolve_pair(symbol)
        interval = _TF_TO_KRAKEN_MINUTES.get(timeframe, 1)

        params = {"pair": pair, "interval": str(interval)}
        if before:
            if before.tzinfo is None:
                before = before.replace(tzinfo=timezone.utc)
            # Kraken accepts 'since' timestamp
            params["since"] = str(int(before.timestamp()) - (limit * interval * 60))

        query_str = urllib.parse.urlencode(params)
        url = f"{self.base_url}/OHLC?{query_str}"

        data = self._http_get_with_retry(url)
        result = data.get("result", {})

        # Exclude 'last' key to get candle array key
        candle_key = next((k for k in result.keys() if k != "last"), None)
        if not candle_key or not isinstance(result[candle_key], list):
            logger.warning("Kraken returned empty or unexpected payload for pair %s: %s", pair, data)
            return CandleSeries(symbol=symbol, timeframe=timeframe, candles=[])

        raw_bars = result[candle_key]
        candles: List[Candle] = []

        # Kraken raw bar structure: [time, open, high, low, close, vwap, volume, count]
        for bar in raw_bars:
            try:
                t = int(bar[0])
                open_price = float(bar[1])
                high_price = float(bar[2])
                low_price = float(bar[3])
                close_price = float(bar[4])
                volume = float(bar[6])

                # Filter by `before` if specified
                bar_dt = datetime.fromtimestamp(t, tz=timezone.utc)
                if before and bar_dt > before:
                    continue

                candles.append(
                    Candle(
                        symbol=symbol,
                        timeframe=timeframe,
                        open=open_price,
                        high=high_price,
                        low=low_price,
                        close=close_price,
                        volume=volume,
                        timestamp=bar_dt,
                    )
                )
            except (ValueError, IndexError) as e:
                logger.debug("Skipping invalid bar: %s (%s)", bar, e)
                continue

        # Keep last `limit` candles
        if len(candles) > limit:
            candles = candles[-limit:]

        return CandleSeries(symbol=symbol, timeframe=timeframe, candles=candles)
