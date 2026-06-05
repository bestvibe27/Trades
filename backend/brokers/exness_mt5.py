from __future__ import annotations

from backend.brokers.base_broker import BaseBroker, BrokerOrderResult
from backend.data.mt5_connector import MT5Connector


class ExnessMT5Broker(BaseBroker):
	def __init__(self, server: str | None = None, login: str | None = None) -> None:
		self.mt5 = MT5Connector(server=server, login=login)
		self.mt5.connect()

	def buy(self, symbol: str, quantity: float, price: float) -> BrokerOrderResult:
		res = self.mt5.place_order(symbol, "buy", quantity, price)
		return BrokerOrderResult(order_id=str(res.get("id", "")), status=str(res.get("status", "unknown")))

	def sell(self, symbol: str, quantity: float, price: float) -> BrokerOrderResult:
		res = self.mt5.place_order(symbol, "sell", quantity, price)
		return BrokerOrderResult(order_id=str(res.get("id", "")), status=str(res.get("status", "unknown")))
