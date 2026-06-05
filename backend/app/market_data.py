"""Market data API router."""

from __future__ import annotations

from fastapi import APIRouter

from backend.data.data_provider import MockDataProvider


router = APIRouter(prefix="/market", tags=["market"])
provider = MockDataProvider()


@router.get("/candles/{symbol}/{timeframe}")
async def candles(symbol: str, timeframe: str, limit: int = 100) -> dict:
    series = provider.get_historical_candles(symbol, timeframe, limit=limit)
    return {"symbol": symbol, "timeframe": timeframe, "candles": [c.__dict__ for c in series.candles]}


