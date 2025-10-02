"""Domain models for orders, positions, and trades."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, Enum):
    NEW = "new"
    FILLED = "filled"
    REJECTED = "rejected"


@dataclass
class Order:
    symbol: str
    side: OrderSide
    quantity: float
    price: float
    id: str = ""
    status: OrderStatus = OrderStatus.NEW

    def __post_init__(self) -> None:
        if not self.id:
            self.id = str(uuid.uuid4())


@dataclass
class Position:
    symbol: str
    quantity: float
    avg_price: float


@dataclass
class Trade:
    symbol: str
    quantity: float
    entry_price: float
    exit_price: float
    pnl: float
    notes: Optional[str] = None


