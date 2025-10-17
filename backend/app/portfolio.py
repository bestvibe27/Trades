"""Portfolio API router."""

from __future__ import annotations

from fastapi import APIRouter

from backend.core.trading_engine import TradingEngine


router = APIRouter(prefix="/portfolio", tags=["portfolio"])
engine = TradingEngine()


@router.get("/positions")
async def positions() -> dict:
    return {"positions": [p.__dict__ for p in engine.open_positions.values()]}

@router.get("/trades")
async def trades() -> dict:
    return {"trades": [t.__dict__ for t in engine.completed_trades]}


