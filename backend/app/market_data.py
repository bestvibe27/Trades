"""Market data API router.

Serves historical candles, preferring live broker (MT5) data when available
and falling back to the synthetic MockDataProvider for development / offline use.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.data.kraken_provider import KrakenDataProvider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market", tags=["market"])
provider = KrakenDataProvider()

# Lazily reuse the broker connector when available
_broker = None


def _get_broker():
    global _broker
    if _broker is not None:
        return _broker
    try:
        from backend.data.mt5_connector import MT5Connector

        _broker = MT5Connector()
        if not _broker.is_connected():
            _broker.connect()
        return _broker
    except Exception as e:
        logger.debug("Broker unavailable for market candles: %s", e)
        return None


def _serialize_candle(c) -> dict:
    ts = c.timestamp
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        ts_str = ts.isoformat()
    else:
        ts_str = str(ts)
    return {
        "symbol": c.symbol,
        "timeframe": c.timeframe,
        "open": c.open,
        "high": c.high,
        "low": c.low,
        "close": c.close,
        "volume": c.volume,
        "timestamp": ts_str,
    }


@router.get("/candles/{symbol}/{timeframe}")
async def candles(
    symbol: str,
    timeframe: str,
    limit: int = Query(200, ge=1, le=5000),
    before: Optional[str] = Query(
        None,
        description="ISO timestamp; return bars ending at/before this time",
    ),
) -> dict:
    """Return OHLCV candles for *symbol* / *timeframe*.

    Tries the connected MT5 broker first; falls back to real Kraken market data.
    """
    before_dt: Optional[datetime] = None
    if before:
        try:
            before_dt = datetime.fromisoformat(before.replace("Z", "+00:00"))
            if before_dt.tzinfo is None:
                before_dt = before_dt.replace(tzinfo=timezone.utc)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid before timestamp: {e}") from e

    broker = _get_broker()
    if broker is not None and broker.is_connected() and not getattr(broker, "use_mock", False):
        try:
            bars = broker.get_candles(symbol, timeframe, limit=limit, before=before_dt)
            if bars:
                return {
                    "symbol": symbol,
                    "timeframe": timeframe,
                    "source": "mt5",
                    "candles": [
                        {
                            "symbol": symbol,
                            "timeframe": timeframe,
                            "open": b["open"],
                            "high": b["high"],
                            "low": b["low"],
                            "close": b["close"],
                            "volume": b["volume"],
                            "timestamp": b["timestamp"],
                        }
                        for b in bars
                    ],
                }
        except Exception as e:
            logger.warning("Broker candles failed, falling back to Kraken market data: %s", e)

    try:
        series = provider.get_historical_candles(
            symbol, timeframe, limit=limit, before=before_dt
        )
        return {
            "symbol": symbol,
            "timeframe": symbol,
            "source": "kraken",
            "candles": [_serialize_candle(c) for c in series.candles],
        }
    except Exception as e:
        logger.error("Kraken market data error: %s", e)
        raise HTTPException(status_code=502, detail=f"Market data provider error: {e}") from e


@router.get("/timeframes")
async def timeframes() -> dict:
    return {
        "timeframes": [
            "1m", "3m", "5m", "15m", "30m",
            "1h", "2h", "4h", "6h", "12h",
            "1d", "1w", "1M",
        ]
    }
