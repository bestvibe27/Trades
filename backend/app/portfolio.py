"""Portfolio API router."""

from __future__ import annotations

from datetime import datetime, timezone
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


@router.get("/summary")
async def summary() -> dict:
    total_equity = 100000.0
    unrealized_pnl = 0.0
    realized_pnl = sum(t.pnl for t in engine.completed_trades)
    used_margin = 0.0
    free_margin = total_equity - used_margin
    margin_level = 0.0 if used_margin == 0 else total_equity / used_margin * 100.0
    return {
        "totalEquity": total_equity + unrealized_pnl + realized_pnl,
        "availableBalance": total_equity,
        "usedMargin": used_margin,
        "freeMargin": free_margin,
        "marginLevel": margin_level,
        "unrealizedPnL": unrealized_pnl,
        "realizedPnL": realized_pnl,
        "totalPnL": unrealized_pnl + realized_pnl,
        "totalPnLPercent": 0.0,
        "positions": [p.__dict__ for p in engine.open_positions.values()],
        "lastUpdate": datetime.now(timezone.utc).isoformat(),
    }


