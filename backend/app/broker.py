"""Broker (Exness MT5) API router."""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from backend.data.mt5_connector import MT5Connector
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import Trade, Position

router = APIRouter(prefix="/broker", tags=["broker"])

# Single connector instance for process lifetime (lazy connect)
_connector = MT5Connector()

def _ensure_connected() -> None:
    try:
        if not _connector.is_connected():
            _connector.connect()
    except Exception:
        # Swallow exceptions here; detailed error is exposed via get_last_error
        pass


class MarketOrderRequest(BaseModel):
    symbol: str = Field(..., description="Trading symbol, e.g., EURUSD")
    side: str = Field(..., pattern="^(buy|sell)$", description="buy or sell")
    volume: float = Field(..., gt=0, description="Lots/volume, e.g., 0.1")
    sl: Optional[float] = Field(None, description="Stop Loss price")
    tp: Optional[float] = Field(None, description="Take Profit price")
    comment: Optional[str] = Field(None, description="Order comment")


@router.get("/status")
async def status() -> dict:
    _ensure_connected()
    return {
        "connected": _connector.is_connected(),
        "account": (_connector.get_account_info().__dict__ if _connector.get_account_info() else None),
        "last_error": _connector.get_last_error(),
    }


@router.get("/quote/{symbol}")
async def get_quote(symbol: str) -> dict:
    _ensure_connected()
    price = _connector.get_last_price(symbol)
    bid, ask = _connector.get_bid_ask(symbol)
    return {"symbol": symbol, "last": price, "bid": bid, "ask": ask}


@router.get("/symbols")
async def list_symbols() -> dict:
    _ensure_connected()
    symbols = _connector.get_symbols()
    return {"symbols": symbols}


@router.get("/symbols/{symbol}")
async def get_symbol_info(symbol: str) -> dict:
    _ensure_connected()
    info = _connector.get_symbol_info(symbol)
    if not info:
        return {"symbol": symbol, "found": False}
    # Convert dataclass-like to dict when available
    try:
        data = info.__dict__
    except Exception:
        data = {}
    # Provide common fields we need for client validation
    # Fallbacks for real MT5 path where our connector may return minimal info
    return {
        "symbol": symbol,
        "found": True,
        "digits": getattr(info, "digits", 5) if hasattr(info, "digits") else 5,
        "volume_min": getattr(info, "volume_min", 0.01) if hasattr(info, "volume_min") else 0.01,
        "volume_step": getattr(info, "volume_step", 0.01) if hasattr(info, "volume_step") else 0.01,
        "volume_max": getattr(info, "volume_max", 100.0) if hasattr(info, "volume_max") else 100.0,
        "trade_allowed": getattr(info, "trade_allowed", None) if hasattr(info, "trade_allowed") else None,
        "trade_mode": getattr(info, "trade_mode", None) if hasattr(info, "trade_mode") else None,
        **({k: v for k, v in data.items() if k not in {"digits","volume_min","volume_step","volume_max"}}),
    }


@router.get("/account")
async def get_account() -> dict:
    _ensure_connected()
    return {
        "balance": _connector.get_balance(),
        "equity": _connector.get_equity(),
        "free_margin": _connector.get_free_margin(),
    }


@router.get("/positions")
async def get_positions(db: Session = Depends(get_db)) -> dict:
    _ensure_connected()
    positions = _connector.get_open_positions()
    # Upsert positions into DB for persistence
    try:
        for p in positions:
            ticket = int(p.get("ticket") or 0)
            if not ticket:
                continue
            existing = db.get(Position, ticket)
            if existing:
                existing.symbol = p.get("symbol")
                existing.side = p.get("side")
                existing.volume = float(p.get("volume", 0))
                existing.price_open = float(p.get("price_open", 0))
                existing.price_current = float(p.get("price_current", 0))
                existing.tp = float(p.get("tp", 0))
                existing.sl = float(p.get("sl", 0))
                existing.swap = float(p.get("swap", 0))
                existing.profit = float(p.get("profit", 0))
            else:
                db.add(Position(
                    ticket=ticket,
                    symbol=p.get("symbol"),
                    side=p.get("side"),
                    volume=float(p.get("volume", 0)),
                    price_open=float(p.get("price_open", 0)),
                    price_current=float(p.get("price_current", 0)),
                    tp=float(p.get("tp", 0)),
                    sl=float(p.get("sl", 0)),
                    swap=float(p.get("swap", 0)),
                    profit=float(p.get("profit", 0)),
                ))
        db.commit()
    except Exception:
        db.rollback()
    return {"positions": positions}


class ModifySLTPRequest(BaseModel):
    sl: Optional[float] = Field(None, ge=0)
    tp: Optional[float] = Field(None, ge=0)


@router.put("/positions/{ticket}/sltp")
async def update_sltp(ticket: int, req: ModifySLTPRequest, db: Session = Depends(get_db)) -> dict:
    _ensure_connected()
    res = _connector.modify_position_sl_tp(ticket=ticket, sl=req.sl, tp=req.tp)
    if res.get("success"):
        # reflect into DB
        try:
            pos = db.get(Position, ticket)
            if pos:
                if req.sl is not None:
                    pos.sl = float(req.sl)
                if req.tp is not None:
                    pos.tp = float(req.tp)
                db.commit()
        except Exception:
            db.rollback()
    return res


@router.get("/trades")
async def get_trades(limit: int = 20) -> dict:
    _ensure_connected()
    return {"trades": _connector.get_recent_trades(limit)}


@router.post("/order/market")
async def market_order(req: MarketOrderRequest, db: Session = Depends(get_db)) -> dict:
    _ensure_connected()
    res = _connector.place_order(
        symbol=req.symbol,
        side=req.side,
        quantity=req.volume,
        price=_connector.get_last_price(req.symbol),
        sl=req.sl or 0.0,
        tp=req.tp or 0.0,
        comment="ui_market_order",
    )
    # persist to DB if success
    if isinstance(res, dict) and not res.get("error"):
        try:
            db.add(Trade(
                broker_ticket=str(res.get("id")),
                symbol=res.get("symbol"),
                side=res.get("side"),
                volume=float(res.get("quantity", 0.0)),
                price=float(res.get("price", 0.0)),
                profit=0.0,
            ))
            db.commit()
        except Exception:
            db.rollback()
    return res
