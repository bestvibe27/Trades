"""Broker (Exness MT5) API router."""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import asyncio
import json
from pydantic import BaseModel, Field

from backend.data.mt5_connector import MT5Connector

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
async def get_positions() -> dict:
    _ensure_connected()
    return {"positions": _connector.get_open_positions()}


@router.get("/trades")
async def get_trades(limit: int = 20) -> dict:
    _ensure_connected()
    return {"trades": _connector.get_recent_trades(limit)}


@router.post("/order/market")
async def market_order(req: MarketOrderRequest) -> dict:
    _ensure_connected()
    res = _connector.place_order(
        symbol=req.symbol,
        side=req.side,
        quantity=req.volume,
        price=_connector.get_last_price(req.symbol),
        sl=req.sl or 0.0,
        tp=req.tp or 0.0,
        comment=req.comment or "",
        order_type="market",
    )
    return res


# --- Charting & Depth ---
@router.get("/candles")
async def get_candles(symbol: str, tf: str = Query("M1"), limit: int = Query(500, ge=1, le=5000)) -> dict:
    _ensure_connected()
    data = _connector.get_candles(symbol, tf, limit)
    return {"symbol": symbol, "timeframe": tf, "candles": data}


@router.get("/depth")
async def get_depth(symbol: str) -> dict:
    _ensure_connected()
    book = _connector.get_order_book(symbol)
    return {"symbol": symbol, **book}


@router.websocket("/stream")
async def stream_ws(ws: WebSocket, symbol: str, tf: str = "M1"):
    await ws.accept()
    _ensure_connected()
    try:
        # prime data
        candles = _connector.get_candles(symbol, tf, 200)
        await ws.send_text(json.dumps({"type": "snapshot", "candles": candles}))
        while True:
            bid, ask = _connector.get_bid_ask(symbol)
            last = _connector.get_last_price(symbol)
            depth = _connector.get_order_book(symbol)
            msg = {
                "type": "tick",
                "symbol": symbol,
                "bid": bid,
                "ask": ask,
                "last": last,
                "spread": (ask - bid) if (bid and ask) else 0,
                "time": int(asyncio.get_event_loop().time()*1000),
                "depth": depth,
            }
            await ws.send_text(json.dumps(msg))
            await asyncio.sleep(0.25)
    except WebSocketDisconnect:
        return
    except Exception:
        # close quietly
        try:
            await ws.close()
        except Exception:
            pass
