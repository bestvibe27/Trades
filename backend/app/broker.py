"""Broker (Exness MT5) API router."""
from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.data.mt5_connector import MT5Connector
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.api.database import get_db, Trade

# Simple in-process candle cache: (symbol, tf, before_key, limit) -> (expires_at, payload)
_candle_cache: dict[tuple, tuple[float, dict]] = {}
_CANDLE_CACHE_TTL = 5.0  # seconds

router = APIRouter(prefix="/broker", tags=["broker"])
logger = logging.getLogger(__name__)

# Single connector instance for process lifetime (lazy connect)
_connector = MT5Connector()


def _ensure_connected() -> None:
    try:
        if not _connector.is_connected():
            _connector.connect()
    except Exception as e:
        logger.warning(f"MT5 connection failed: {e}")


class MarketOrderRequest(BaseModel):
    symbol: str = Field(..., description="Trading symbol, e.g., EURUSD")
    side: str = Field(..., pattern="^(buy|sell)$", description="buy or sell")
    volume: float = Field(..., gt=0, description="Lots/volume, e.g., 0.1")
    sl: Optional[float] = Field(None, description="Stop Loss price")
    tp: Optional[float] = Field(None, description="Take Profit price")
    comment: Optional[str] = Field(None, description="Order comment")


class PendingOrderRequest(BaseModel):
    symbol: str = Field(..., description="Trading symbol")
    side: str = Field(..., pattern="^(buy|sell)$")
    volume: float = Field(..., gt=0)
    price: float = Field(..., gt=0, description="Limit / pending price")
    sl: Optional[float] = Field(None)
    tp: Optional[float] = Field(None)
    comment: Optional[str] = Field(None)


def _validate_volume(symbol: str, volume: float) -> tuple[float, Optional[str]]:
    info = _connector.get_symbol_info(symbol)
    if not info:
        return volume, f"Symbol not found: {symbol}"
    vol_min = float(getattr(info, "volume_min", 0.01) or 0.01)
    vol_step = float(getattr(info, "volume_step", 0.01) or 0.01)
    vol_max = float(getattr(info, "volume_max", 100.0) or 100.0)
    try:
        steps = round(float(volume) / vol_step)
        vol = steps * vol_step
    except Exception:
        vol = float(volume)
    vol = max(vol_min, min(vol_max, vol))
    if vol < vol_min:
        return vol, f"Volume below minimum {vol_min}"
    if vol > vol_max:
        return vol, f"Volume above maximum {vol_max}"
    return vol, None


def _validate_stop_levels(
    symbol: str,
    entry: float,
    sl: Optional[float],
    tp: Optional[float],
) -> Optional[str]:
    info = _connector.get_symbol_info(symbol)
    if not info:
        return None
    stops_level = int(getattr(info, "trade_stops_level", 0) or 0)
    point = float(getattr(info, "point", 0.01) or 0.01)
    min_dist = stops_level * point
    if min_dist <= 0:
        return None
    if sl is not None and sl > 0 and abs(sl - entry) < min_dist:
        return f"Stop Loss too close to entry (min distance {min_dist})"
    if tp is not None and tp > 0 and abs(tp - entry) < min_dist:
        return f"Take Profit too close to entry (min distance {min_dist})"
    return None


def _validate_pending_price(side: str, price: float, bid: float, ask: float) -> Optional[str]:
    if price <= 0:
        return "Invalid pending price"
    if side.lower() == "buy" and price >= ask:
        return "Buy limit must be below the current ask"
    if side.lower() == "sell" and price <= bid:
        return "Sell limit must be above the current bid"
    return None


def _check_margin(symbol: str, volume: float, price: float) -> Optional[str]:
    free = _connector.get_free_margin()
    required = _connector.estimate_margin(symbol, volume, price)
    if required > free + 1e-9:
        return f"Insufficient margin: need {required:.2f}, free {free:.2f}"
    return None


def _persist_trade(
    db: Session,
    *,
    symbol: str,
    side: str,
    volume: float,
    execution_price: float,
    sl: Optional[float],
    tp: Optional[float],
    order_id: str,
    comment: str,
    status: str = "OPEN",
    commission: float = 0.0,
) -> dict:
    trade = Trade(
        account_id=1,
        strategy_id=None,
        symbol=symbol,
        trade_type=side.upper(),
        volume=volume,
        open_price=execution_price,
        close_price=None,
        stop_loss=sl or None,
        take_profit=tp or None,
        commission=commission,
        swap=0.0,
        profit_loss=None,
        status=status,
        order_id=str(order_id),
        execution_price=execution_price,
        execution_time=datetime.utcnow(),
        source="MANUAL",
        base_currency="USD",
        profit_currency="USD",
        risk_reward_ratio=None,
        pip_gain=None,
        duration=None,
        notes=comment,
        open_time=datetime.utcnow(),
        close_time=None,
    )
    db.add(trade)
    db.commit()
    return {
        "success": True,
        "trade_id": trade.trade_id,
        "order_id": trade.order_id,
        "symbol": trade.symbol,
        "side": trade.trade_type,
        "volume": trade.volume,
        "price": trade.execution_price,
        "status": trade.status,
        "execution_time": trade.execution_time.isoformat() if trade.execution_time else None,
        "message": "Trade executed successfully" if status == "OPEN" else "Pending order placed",
    }


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


@router.get("/candles/{symbol}/{timeframe}")
async def get_candles(
    symbol: str,
    timeframe: str,
    limit: int = Query(200, ge=1, le=5000),
    before: Optional[str] = Query(
        None,
        description="ISO timestamp; return bars ending at/before this time (pagination)",
    ),
) -> dict:
    """Fetch historical OHLCV candles from the connected broker (MT5).

    Supports pagination via `before` for seamless chart history loading.
    Results are briefly cached to reduce broker load under polling clients.
    """
    _ensure_connected()
    before_dt: Optional[datetime] = None
    if before:
        try:
            before_dt = datetime.fromisoformat(before.replace("Z", "+00:00"))
            if before_dt.tzinfo is None:
                before_dt = before_dt.replace(tzinfo=timezone.utc)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid before timestamp: {e}") from e

    cache_key = (symbol, timeframe, before or "", limit)
    now = time.monotonic()
    cached = _candle_cache.get(cache_key)
    if cached and cached[0] > now:
        return cached[1]

    bars = _connector.get_candles(symbol, timeframe, limit=limit, before=before_dt)
    payload = {
        "symbol": symbol,
        "timeframe": timeframe,
        "source": "mock" if _connector.use_mock else "mt5",
        "candles": [
            {
                "symbol": symbol,
                "timeframe": timeframe,
                "open": c["open"],
                "high": c["high"],
                "low": c["low"],
                "close": c["close"],
                "volume": c["volume"],
                "timestamp": c["timestamp"],
            }
            for c in bars
        ],
    }
    _candle_cache[cache_key] = (now + _CANDLE_CACHE_TTL, payload)
    # Bound cache size
    if len(_candle_cache) > 256:
        expired = [k for k, (exp, _) in _candle_cache.items() if exp <= now]
        for k in expired:
            _candle_cache.pop(k, None)
    return payload


@router.get("/stream/{symbol}")
async def stream_quotes(
    symbol: str,
    interval_ms: int = Query(1000, ge=200, le=10000),
):
    """Server-Sent Events stream of live bid/ask/last for *symbol*.

    Clients should reconnect on disconnect; the stream emits a heartbeat
    comment every ~15s so proxies keep the connection alive.
    """
    _ensure_connected()

    async def event_generator():
        last_heartbeat = time.monotonic()
        try:
            while True:
                try:
                    price = _connector.get_last_price(symbol)
                    bid, ask = _connector.get_bid_ask(symbol)
                    payload = {
                        "symbol": symbol,
                        "last": price,
                        "bid": bid,
                        "ask": ask,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                except Exception as e:
                    yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

                now = time.monotonic()
                if now - last_heartbeat > 15:
                    yield ": heartbeat\n\n"
                    last_heartbeat = now

                await asyncio.sleep(interval_ms / 1000.0)
        except asyncio.CancelledError:
            return

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


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
    try:
        data = info.__dict__
    except Exception:
        data = {}
    return {
        "symbol": symbol,
        "found": True,
        "digits": getattr(info, "digits", 5),
        "volume_min": getattr(info, "volume_min", 0.01),
        "volume_step": getattr(info, "volume_step", 0.01),
        "volume_max": getattr(info, "volume_max", 100.0),
        "trade_allowed": getattr(info, "trade_allowed", None),
        "trade_mode": getattr(info, "trade_mode", None),
        "point": getattr(info, "point", None),
        "contract_size": getattr(info, "contract_size", None),
        "trade_stops_level": getattr(info, "trade_stops_level", None),
        "swap_long": getattr(info, "swap_long", None),
        "swap_short": getattr(info, "swap_short", None),
        "trade_tick_size": getattr(info, "trade_tick_size", None),
        "spread": getattr(info, "spread", None),
        **({k: v for k, v in data.items() if k not in {
            "digits", "volume_min", "volume_step", "volume_max",
            "point", "contract_size", "trade_stops_level",
            "swap_long", "swap_short", "trade_tick_size", "spread",
        }}),
    }


@router.get("/account")
async def get_account() -> dict:
    _ensure_connected()
    acc = _connector.get_account_info()
    return {
        "balance": _connector.get_balance(),
        "equity": _connector.get_equity(),
        "free_margin": _connector.get_free_margin(),
        "leverage": getattr(acc, "leverage", 100) if acc else 100,
        "connected": _connector.is_connected(),
        "mode": "mock" if _connector.use_mock else "live",
    }


@router.get("/positions")
async def get_positions() -> dict:
    _ensure_connected()
    return {"positions": _connector.get_open_positions()}


@router.get("/trades")
async def get_trades(limit: int = 20) -> dict:
    _ensure_connected()
    return {"trades": _connector.get_recent_trades(limit)}


@router.get("/order/preview")
async def order_preview(
    symbol: str = Query(...),
    side: str = Query(..., pattern="^(buy|sell)$"),
    volume: float = Query(..., gt=0),
    price: Optional[float] = Query(None),
) -> dict:
    """Compute fees, margin, and instrument costs for the order ticket."""
    _ensure_connected()
    vol, vol_err = _validate_volume(symbol, volume)
    if vol_err and "not found" in vol_err.lower():
        return {"error": vol_err, "success": False}

    bid, ask = _connector.get_bid_ask(symbol)
    px = price if price and price > 0 else (ask if side == "buy" else bid)
    costs = _connector.estimate_order_costs(symbol, vol, px)
    return {"success": True, "side": side, **costs}


@router.get("/trades/database")
async def get_database_trades(limit: int = 20, db: Session = Depends(get_db)) -> dict:
    """Get trades from database with enhanced information."""
    try:
        trades = db.query(Trade).order_by(Trade.open_time.desc()).limit(limit).all()

        trade_list = []
        for trade in trades:
            trade_dict = {
                "trade_id": trade.trade_id,
                "symbol": trade.symbol,
                "side": trade.trade_type,
                "volume": float(trade.volume) if trade.volume else 0.0,
                "open_price": float(trade.open_price) if trade.open_price else 0.0,
                "close_price": float(trade.close_price) if trade.close_price else None,
                "execution_price": float(trade.execution_price) if trade.execution_price else 0.0,
                "stop_loss": float(trade.stop_loss) if trade.stop_loss else None,
                "take_profit": float(trade.take_profit) if trade.take_profit else None,
                "profit_loss": float(trade.profit_loss) if trade.profit_loss else None,
                "status": trade.status,
                "source": trade.source,
                "commission": float(trade.commission) if trade.commission else 0.0,
                "swap": float(trade.swap) if trade.swap else 0.0,
                "order_id": trade.order_id,
                "execution_time": trade.execution_time.isoformat() if trade.execution_time else None,
                "open_time": trade.open_time.isoformat() if trade.open_time else None,
                "close_time": trade.close_time.isoformat() if trade.close_time else None,
                "notes": trade.notes,
                "pip_gain": float(trade.pip_gain) if trade.pip_gain else None,
                "risk_reward_ratio": float(trade.risk_reward_ratio) if trade.risk_reward_ratio else None,
            }
            trade_list.append(trade_dict)

        return {"trades": trade_list, "total": len(trade_list)}
    except Exception as e:
        logger.error("Error fetching database trades: %s", str(e))
        return {"trades": [], "total": 0, "error": str(e)}


@router.post("/order/market")
async def market_order(req: MarketOrderRequest, db: Session = Depends(get_db)) -> dict:
    _ensure_connected()

    if not _connector.is_connected():
        return {"success": False, "error": "Broker disconnected"}

    vol, vol_err = _validate_volume(req.symbol, req.volume)
    if vol_err:
        return {"success": False, "error": vol_err}

    bid, ask = _connector.get_bid_ask(req.symbol)
    if bid <= 0 or ask <= 0:
        return {"success": False, "error": "Market closed or quote unavailable"}

    execution_price = ask if req.side.lower() == "buy" else bid

    stop_err = _validate_stop_levels(req.symbol, execution_price, req.sl, req.tp)
    if stop_err:
        return {"success": False, "error": stop_err}

    margin_err = _check_margin(req.symbol, vol, execution_price)
    if margin_err:
        return {"success": False, "error": margin_err}

    costs = _connector.estimate_order_costs(req.symbol, vol, execution_price)

    res = _connector.place_order(
        symbol=req.symbol,
        side=req.side,
        quantity=vol,
        price=execution_price,
        sl=req.sl or 0.0,
        tp=req.tp or 0.0,
        comment=req.comment or "ui_market_order",
        order_type="market",
    )

    if isinstance(res, dict) and not res.get("error"):
        try:
            return _persist_trade(
                db,
                symbol=req.symbol,
                side=req.side,
                volume=vol,
                execution_price=float(res.get("price", execution_price)),
                sl=req.sl,
                tp=req.tp,
                order_id=str(res.get("id", "")),
                comment=f"Manual market order: {req.comment or 'ui_market_order'}",
                status="OPEN",
                commission=float(costs.get("fees", 0.0)),
            )
        except Exception as e:
            db.rollback()
            logger.error("Error persisting broker trade: %s", str(e))
            return {
                "error": f"Trade executed but failed to save to database: {str(e)}",
                "success": False,
            }

    return {
        "error": res.get("error", "Unknown error occurred") if isinstance(res, dict) else "Unknown error",
        "success": False,
    }


@router.post("/order/pending")
async def pending_order(req: PendingOrderRequest, db: Session = Depends(get_db)) -> dict:
    _ensure_connected()

    if not _connector.is_connected():
        return {"success": False, "error": "Broker disconnected"}

    vol, vol_err = _validate_volume(req.symbol, req.volume)
    if vol_err:
        return {"success": False, "error": vol_err}

    bid, ask = _connector.get_bid_ask(req.symbol)
    if bid <= 0 or ask <= 0:
        return {"success": False, "error": "Market closed or quote unavailable"}

    pending_err = _validate_pending_price(req.side, req.price, bid, ask)
    if pending_err:
        return {"success": False, "error": pending_err}

    stop_err = _validate_stop_levels(req.symbol, req.price, req.sl, req.tp)
    if stop_err:
        return {"success": False, "error": stop_err}

    margin_err = _check_margin(req.symbol, vol, req.price)
    if margin_err:
        return {"success": False, "error": margin_err}

    costs = _connector.estimate_order_costs(req.symbol, vol, req.price)

    res = _connector.place_order(
        symbol=req.symbol,
        side=req.side,
        quantity=vol,
        price=req.price,
        sl=req.sl or 0.0,
        tp=req.tp or 0.0,
        comment=req.comment or "ui_pending_order",
        order_type="pending",
    )

    if isinstance(res, dict) and not res.get("error"):
        try:
            return _persist_trade(
                db,
                symbol=req.symbol,
                side=req.side,
                volume=vol,
                execution_price=req.price,
                sl=req.sl,
                tp=req.tp,
                order_id=str(res.get("id", "")),
                comment=f"Pending order: {req.comment or 'ui_pending_order'}",
                status="PENDING",
                commission=float(costs.get("fees", 0.0)),
            )
        except Exception as e:
            db.rollback()
            logger.error("Error persisting pending order: %s", str(e))
            return {
                "error": f"Order accepted but failed to save: {str(e)}",
                "success": False,
            }

    return {
        "error": res.get("error", "Unknown error occurred") if isinstance(res, dict) else "Unknown error",
        "success": False,
    }
