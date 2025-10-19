"""Core trading engine orchestrating strategies, risk, and brokers.

This is a simplified, production-ready skeleton with clear extension points.
It uses in-memory state and is framework-agnostic.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime

from backend.models.trade import Order, OrderSide, OrderStatus, Position, Trade
from backend.strategies.base_strategy import BaseStrategy
from backend.api.database import Order as DBOrder, Position as DBPosition, Trade as DBTrade


@dataclass
class EngineConfig:
    """Configuration for the trading engine."""

    max_concurrent_positions: int = 10


class TradingEngine:
    """Simple in-memory trading engine with PostgreSQL persistence.

    Responsibilities:
    - Receive signals from strategies
    - Enforce basic constraints
    - Manage orders and positions
    - Persist data to PostgreSQL
    """

    def __init__(self, config: Optional[EngineConfig] = None, db_session=None) -> None:
        self.config = config or EngineConfig()
        self.db_session = db_session
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
        
        # Persist order to database
        self._persist_order(order)
        
        self._apply_filled_order(order)
        return order

    def _apply_filled_order(self, order: Order) -> None:
        pos = self.open_positions.get(order.symbol)
        if order.side == OrderSide.BUY:
            if pos is None:
                self.open_positions[order.symbol] = Position(
                    symbol=order.symbol, quantity=order.quantity, avg_price=order.price
                )
                # Persist new position to database
                self._persist_position(order.symbol, order.quantity, order.price)
            else:
                new_qty = pos.quantity + order.quantity
                pos.avg_price = (pos.avg_price * pos.quantity + order.price * order.quantity) / new_qty
                pos.quantity = new_qty
                # Update position in database
                self._update_position(order.symbol, new_qty, pos.avg_price)
        else:  # SELL
            if pos is None:
                return  # Nothing to sell
            sell_qty = min(order.quantity, pos.quantity)
            realized_pnl = (order.price - pos.avg_price) * sell_qty
            trade = Trade(symbol=order.symbol, quantity=sell_qty, entry_price=pos.avg_price, exit_price=order.price, pnl=realized_pnl)
            self.completed_trades.append(trade)
            
            # Persist trade to database
            self._persist_trade(trade)
            
            pos.quantity -= sell_qty
            if pos.quantity <= 0:
                self.open_positions.pop(order.symbol, None)
                # Remove position from database
                self._remove_position(order.symbol)
            else:
                # Update position quantity in database
                self._update_position(order.symbol, pos.quantity, pos.avg_price)

    # --- Strategy integration ----------------------------------------------
    def run_strategy_step(self, strategy: BaseStrategy, market_price: float) -> Optional[Order]:
        """Let a strategy generate a signal and place an order accordingly."""
        signal = strategy.generate_signal(market_price)
        if signal is None:
            return None
        return self.place_order(signal)

    # --- Database persistence methods --------------------------------------
    def _persist_order(self, order: Order) -> None:
        """Persist order to database."""
        if not self.db_session:
            return
        
        try:
            db_order = DBOrder(
                id=order.id,
                user_id="default_user",  # TODO: Get from auth context
                symbol=order.symbol,
                side=order.side.value,
                type="market",
                quantity=order.quantity,
                price=order.price,
                status=order.status.value,
                filled_quantity=order.quantity if order.status == OrderStatus.FILLED else 0.0,
                average_price=order.price if order.status == OrderStatus.FILLED else None,
                created_at=datetime.utcnow(),
                filled_at=datetime.utcnow() if order.status == OrderStatus.FILLED else None
            )
            self.db_session.add(db_order)
            self.db_session.commit()
        except Exception as e:
            self.db_session.rollback()
            print(f"Error persisting order: {e}")  # TODO: Use proper logging

    def _persist_position(self, symbol: str, quantity: float, avg_price: float) -> None:
        """Persist new position to database."""
        if not self.db_session:
            return
        
        try:
            db_position = DBPosition(
                id=f"pos_{symbol}_{datetime.utcnow().timestamp()}",
                user_id="default_user",  # TODO: Get from auth context
                symbol=symbol,
                side="long" if quantity > 0 else "short",
                quantity=abs(quantity),
                entry_price=avg_price,
                current_price=avg_price,
                unrealized_pnl=0.0,
                opened_at=datetime.utcnow()
            )
            self.db_session.add(db_position)
            self.db_session.commit()
        except Exception as e:
            self.db_session.rollback()
            print(f"Error persisting position: {e}")  # TODO: Use proper logging

    def _update_position(self, symbol: str, quantity: float, avg_price: float) -> None:
        """Update existing position in database."""
        if not self.db_session:
            return
        
        try:
            # Find existing position
            db_position = self.db_session.query(DBPosition).filter(
                DBPosition.symbol == symbol,
                DBPosition.user_id == "default_user"
            ).first()
            
            if db_position:
                db_position.quantity = abs(quantity)
                db_position.entry_price = avg_price
                db_position.current_price = avg_price
                db_position.updated_at = datetime.utcnow()
                self.db_session.commit()
        except Exception as e:
            self.db_session.rollback()
            print(f"Error updating position: {e}")  # TODO: Use proper logging

    def _remove_position(self, symbol: str) -> None:
        """Remove position from database."""
        if not self.db_session:
            return
        
        try:
            db_position = self.db_session.query(DBPosition).filter(
                DBPosition.symbol == symbol,
                DBPosition.user_id == "default_user"
            ).first()
            
            if db_position:
                db_position.closed_at = datetime.utcnow()
                self.db_session.commit()
        except Exception as e:
            self.db_session.rollback()
            print(f"Error removing position: {e}")  # TODO: Use proper logging

    def _persist_trade(self, trade: Trade) -> None:
        """Persist completed trade to database."""
        if not self.db_session:
            return
        
        try:
            db_trade = DBTrade(
                account_id=1,  # Default account
                symbol=trade.symbol,
                trade_type="BUY" if trade.quantity > 0 else "SELL",
                volume=abs(trade.quantity),
                open_price=trade.entry_price,
                close_price=trade.exit_price,
                profit_loss=trade.pnl,
                status='CLOSED',
                source='AI',
                open_time=datetime.utcnow(),
                close_time=datetime.utcnow(),
                notes=f"Trading engine trade: {trade.symbol}"
            )
            self.db_session.add(db_trade)
            self.db_session.commit()
        except Exception as e:
            self.db_session.rollback()
            print(f"Error persisting trade: {e}")  # TODO: Use proper logging


