from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class BrokerOrderResult:
	order_id: str
	status: str
	message: Optional[str] = None


class BaseBroker(ABC):
	"""Abstract broker interface for order routing."""

	@abstractmethod
	def buy(self, symbol: str, quantity: float, price: float) -> BrokerOrderResult:
		raise NotImplementedError

	@abstractmethod
	def sell(self, symbol: str, quantity: float, price: float) -> BrokerOrderResult:
		raise NotImplementedError
