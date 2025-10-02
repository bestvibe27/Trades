"""Core trading engine orchestrating strategies, risk, and brokers.

This is a simplified, production-ready skeleton with clear extension points.
It uses in-memory state and is framework-agnostic.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from backend.models.trade import Order, OrderSide, OrderStatus, Position, Trade
from backend.strategies.base_strategy import BaseStrategy


@dataclass
class EngineConfig:
    """Configuration for the trading engine."""

    max_concurrent_positions: int = 10


class TradingEngine:
    """Simple in-memory trading engine.

    Responsibilities:
    - Receive signals from strategies
    - Enforce basic constraints
    - Manage orders and positions
    """

    def __init__(self, config: Optional[EngineConfig] = None) -> None:
        self.config = config or EngineConfig()
        self.open_positions: Dict[str, Position] = {}
        self.open_orders: Dict[str, Order] = {}
        self.completed_trades: List[Trade] = []

    # --- Orders & positions -------------------------------------------------
    def place_order(self, order: Order) -> Order:
        """Place an order if constraints allow it."""
        if len(self.open_positions) >= self.config.max_concurrent_positions:
            order.status = OrderStatus.REJECTED
            return order
        order.status = OrderStatus.FILLED  # Simplified: assume immediate fill
        self.open_orders[order.id] = order
        self._apply_filled_order(order)
        return order

    def _apply_filled_order(self, order: Order) -> None:
        pos = self.open_positions.get(order.symbol)
        if order.side == OrderSide.BUY:
            if pos is None:
                self.open_positions[order.symbol] = Position(
                    symbol=order.symbol, quantity=order.quantity, avg_price=order.price
                )
            else:
                new_qty = pos.quantity + order.quantity
                pos.avg_price = (pos.avg_price * pos.quantity + order.price * order.quantity) / new_qty
                pos.quantity = new_qty
        else:  # SELL
            if pos is None:
                return  # Nothing to sell
            sell_qty = min(order.quantity, pos.quantity)
            realized_pnl = (order.price - pos.avg_price) * sell_qty
            self.completed_trades.append(
                Trade(symbol=order.symbol, quantity=sell_qty, entry_price=pos.avg_price, exit_price=order.price, pnl=realized_pnl)
            )
            pos.quantity -= sell_qty
            if pos.quantity <= 0:
                self.open_positions.pop(order.symbol, None)

    # --- Strategy integration ----------------------------------------------
    def run_strategy_step(self, strategy: BaseStrategy, market_price: float) -> Optional[Order]:
        """Let a strategy generate a signal and place an order accordingly."""
        signal = strategy.generate_signal(market_price)
        if signal is None:
            return None
        return self.place_order(signal)


