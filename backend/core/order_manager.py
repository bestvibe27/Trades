"""Order manager coordinating broker communication."""

from __future__ import annotations

from backend.brokers.base_broker import BaseBroker, BrokerOrderResult


class OrderManager:
    def __init__(self, broker: BaseBroker) -> None:
        self.broker = broker

    def buy(self, symbol: str, quantity: float, price: float) -> BrokerOrderResult:
        return self.broker.buy(symbol, quantity, price)

    def sell(self, symbol: str, quantity: float, price: float) -> BrokerOrderResult:
        return self.broker.sell(symbol, quantity, price)


