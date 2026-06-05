from __future__ import annotations

import uuid
from typing import Dict

from backend.brokers.base_broker import BaseBroker, BrokerOrderResult


class PaperBroker(BaseBroker):
	"""Simulated broker that fills orders immediately at requested price."""

	def __init__(self) -> None:
		self.orders: Dict[str, Dict] = {}

	def buy(self, symbol: str, quantity: float, price: float) -> BrokerOrderResult:
		order_id = str(uuid.uuid4())
		self.orders[order_id] = {"symbol": symbol, "qty": quantity, "price": price, "side": "buy"}
		return BrokerOrderResult(order_id=order_id, status="filled")

	def sell(self, symbol: str, quantity: float, price: float) -> BrokerOrderResult:
		order_id = str(uuid.uuid4())
		self.orders[order_id] = {"symbol": symbol, "qty": quantity, "price": price, "side": "sell"}
		return BrokerOrderResult(order_id=order_id, status="filled")
