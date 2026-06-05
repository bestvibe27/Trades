"""Portfolio API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.core.trading_engine import TradingEngine
from backend.api.database import get_db


router = APIRouter(prefix="/portfolio", tags=["portfolio"])


def get_trading_engine(db=Depends(get_db)):
    """Get trading engine with database session."""
    return TradingEngine(db_session=db)


@router.get("/positions")
async def positions(engine: TradingEngine = Depends(get_trading_engine)) -> dict:
    return {"positions": [p.__dict__ for p in engine.open_positions.values()]}

@router.get("/trades")
async def trades(engine: TradingEngine = Depends(get_trading_engine)) -> dict:
    return {"trades": [t.__dict__ for t in engine.completed_trades]}


