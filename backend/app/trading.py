"""Trading API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.core.trading_engine import TradingEngine
from backend.models.trade import Order, OrderSide
from backend.api.database import get_db, Trade as DBTrade
from datetime import datetime


router = APIRouter(prefix="/trading", tags=["trading"])


def get_trading_engine(db=Depends(get_db)):
    """Get trading engine with database session."""
    return TradingEngine(db_session=db)


class OrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    quantity: float
    price: float


@router.post("/order")
async def place_order(req: OrderRequest, engine: TradingEngine = Depends(get_trading_engine)) -> dict:
    order = Order(symbol=req.symbol, side=req.side, quantity=req.quantity, price=req.price)
    placed = engine.place_order(order)
    # Persist a trade record immediately for every buy/sell action
    db = engine.db_session
    if db is not None:
        try:
            trade = DBTrade(
                account_id=1,
                strategy_id=None,
                symbol=req.symbol,
                trade_type=req.side.value.upper(),
                volume=req.quantity,
                open_price=req.price,
                close_price=None,
                stop_loss=None,
                take_profit=None,
                commission=0.0,
                swap=0.0,
                profit_loss=None,
                status='OPEN',
                order_id=str(placed.id),
                execution_price=req.price,
                execution_time=datetime.utcnow(),
                source='MANUAL',
                base_currency='USD',
                profit_currency='USD',
                risk_reward_ratio=None,
                pip_gain=None,
                duration=None,
                notes='Manual order via /trading/order endpoint'
            )
            db.add(trade)
            db.commit()
        except Exception:
            db.rollback()
            # Do not fail the API on persistence error; order was executed in engine
            pass
    return {"order_id": placed.id, "status": placed.status}


