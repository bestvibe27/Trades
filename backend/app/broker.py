"""Broker (Exness MT5) API router."""
from __future__ import annotations

import logging
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from backend.data.mt5_connector import MT5Connector
from sqlalchemy.orm import Session
from datetime import datetime
from backend.api.database import get_db, Trade

router = APIRouter(prefix="/broker", tags=["broker"])

# Single connector instance for process lifetime (lazy connect)
_connector = MT5Connector()

def _ensure_connected() -> None:
    try:
        if not _connector.is_connected():
            _connector.connect()
    except Exception as e:
        # Log the error but don't fail - let the endpoint handle it gracefully
        logger = logging.getLogger(__name__)
        logger.warning(f"MT5 connection failed: {e}")


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
        "connected": _connector.is_connected(),
        "mode": "mock" if _connector.use_mock else "live"
    }


@router.get("/positions")
async def get_positions() -> dict:
    _ensure_connected()
    return {"positions": _connector.get_open_positions()}


@router.get("/trades")
async def get_trades(limit: int = 20) -> dict:
    _ensure_connected()
    return {"trades": _connector.get_recent_trades(limit)}


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
                "risk_reward_ratio": float(trade.risk_reward_ratio) if trade.risk_reward_ratio else None
            }
            trade_list.append(trade_dict)
        
        return {"trades": trade_list, "total": len(trade_list)}
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error("Error fetching database trades: %s", str(e))
        return {"trades": [], "total": 0, "error": str(e)}


@router.post("/order/market")
async def market_order(req: MarketOrderRequest, db: Session = Depends(get_db)) -> dict:
    _ensure_connected()
    
    # Get current market price for execution
    bid, ask = _connector.get_bid_ask(req.symbol)
    
    # Use appropriate price based on trade direction
    execution_price = ask if req.side.lower() == 'buy' else bid
    
    res = _connector.place_order(
        symbol=req.symbol,
        side=req.side,
        quantity=req.volume,
        price=execution_price,
        sl=req.sl or 0.0,
        tp=req.tp or 0.0,
        comment="ui_market_order",
    )
    
    # Persist to database if successful
    if isinstance(res, dict) and not res.get("error"):
        try:
            # Calculate commission (simplified - you can enhance this)
            commission = 0.0  # Default commission
            
            # Create comprehensive trade record
            trade = Trade(
                account_id=1,  # Default account
                strategy_id=None,  # Manual trade
                symbol=req.symbol,
                trade_type=req.side.upper(),  # BUY/SELL
                volume=req.volume,
                open_price=execution_price,
                close_price=None,  # Will be set when position is closed
                stop_loss=req.sl or None,
                take_profit=req.tp or None,
                commission=commission,
                swap=0.0,  # Default swap
                profit_loss=None,  # Will be calculated when position is closed
                status='OPEN',
                order_id=str(res.get("id", "")),
                execution_price=execution_price,
                execution_time=datetime.utcnow(),
                source='MANUAL',
                base_currency='USD',
                profit_currency='USD',
                risk_reward_ratio=None,  # Can be calculated if SL/TP are set
                pip_gain=None,  # Will be calculated when position is closed
                duration=None,  # Will be calculated when position is closed
                notes=f"Manual market order: {req.comment or 'ui_market_order'}",
                open_time=datetime.utcnow(),
                close_time=None
            )
            
            db.add(trade)
            db.commit()
            
            # Return success response with trade details
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
                "message": "Trade executed successfully"
            }
            
        except Exception as e:
            db.rollback()
            logger = logging.getLogger(__name__)
            logger.error("Error persisting broker trade: %s", str(e))
            return {
                "error": f"Trade executed but failed to save to database: {str(e)}",
                "success": False
            }
    
    # Return error response
    return {
        "error": res.get("error", "Unknown error occurred"),
        "success": False
    }
