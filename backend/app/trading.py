"""Trading API router."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from backend.core.trading_engine import TradingEngine
from backend.models.trade import Order, OrderSide


router = APIRouter(prefix="/trading", tags=["trading"])
engine = TradingEngine()


class OrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    quantity: float
    price: float


@router.post("/order")
async def place_order(req: OrderRequest) -> dict:
    order = Order(symbol=req.symbol, side=req.side, quantity=req.quantity, price=req.price)
    placed = engine.place_order(order)
    return {"order_id": placed.id, "status": placed.status}


