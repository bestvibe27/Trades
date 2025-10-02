"""Strategies API router."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from backend.strategies.rsi_strategy import RSIStrategy
from backend.strategies.sma_crossover import SMACrossoverStrategy


router = APIRouter(prefix="/strategies", tags=["strategies"])


class SMACfg(BaseModel):
    symbol: str
    fast: int = 10
    slow: int = 30


@router.post("/sma/preview")
async def sma_preview(cfg: SMACfg) -> dict:
    strat = SMACrossoverStrategy(cfg.symbol, cfg.fast, cfg.slow)
    return {"name": "sma_crossover", "fast": cfg.fast, "slow": cfg.slow, "symbol": cfg.symbol}


class RSICfg(BaseModel):
    symbol: str
    period: int = 14
    oversold: float = 30
    overbought: float = 70


@router.post("/rsi/preview")
async def rsi_preview(cfg: RSICfg) -> dict:
    strat = RSIStrategy(cfg.symbol, cfg.period, cfg.oversold, cfg.overbought)
    return {"name": "rsi", "period": cfg.period, "symbol": cfg.symbol}


