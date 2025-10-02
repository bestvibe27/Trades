"""Trading API router."""

from __future__ import annotations

from datetime import datetime, timezone
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
    now_iso = datetime.now(timezone.utc).isoformat()
    # Align response shape with frontend expectations (PlaceOrderResponse)
    return {
        "orderId": placed.id,
        "symbol": placed.symbol,
        "side": placed.side.value,
        "type": "market",
        "quantity": placed.quantity,
        "price": placed.price,
        "status": placed.status.value if hasattr(placed.status, "value") else str(placed.status),
        "timestamp": now_iso,
    }


