"""Custom strategy implementation example."""

from __future__ import annotations

from typing import Dict, List, Optional

from backend.models.trade import Order, OrderSide
from backend.strategies.base_strategy import BaseStrategy


class CustomStrategy(BaseStrategy):
    """Example custom strategy that combines multiple indicators.
    
    This strategy demonstrates how to create a more complex trading strategy
    that combines multiple technical indicators and custom logic.
    """

    def __init__(
        self,
        symbol: str,
        quantity: float = 1.0,
        rsi_period: int = 14,
        sma_fast: int = 10,
        sma_slow: int = 30,
        rsi_oversold: float = 30.0,
        rsi_overbought: float = 70.0,
    ) -> None:
        super().__init__(symbol, quantity)
        self.rsi_period = rsi_period
        self.sma_fast = sma_fast
        self.sma_slow = sma_slow
        self.rsi_oversold = rsi_oversold
        self.rsi_overbought = rsi_overbought
        
        # Price history for calculations
        self.price_history: List[float] = []
        self.rsi_values: List[float] = []
        self.sma_fast_values: List[float] = []
        self.sma_slow_values: List[float] = []

    def _calculate_rsi(self, prices: List[float], period: int) -> Optional[float]:
        """Calculate RSI for the given prices."""
        if len(prices) < period + 1:
            return None
            
        gains = []
        losses = []
        
        for i in range(1, len(prices)):
            change = prices[i] - prices[i - 1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))
        
        if len(gains) < period:
            return None
            
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        
        if avg_loss == 0:
            return 100.0
            
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi

    def _calculate_sma(self, prices: List[float], period: int) -> Optional[float]:
        """Calculate Simple Moving Average for the given prices."""
        if len(prices) < period:
            return None
        return sum(prices[-period:]) / period

    def _update_indicators(self, price: float) -> None:
        """Update all technical indicators with the new price."""
        self.price_history.append(price)
        
        # Keep only necessary history
        max_history = max(self.rsi_period + 1, self.sma_slow)
        if len(self.price_history) > max_history:
            self.price_history = self.price_history[-max_history:]
        
        # Calculate RSI
        rsi = self._calculate_rsi(self.price_history, self.rsi_period)
        if rsi is not None:
            self.rsi_values.append(rsi)
            if len(self.rsi_values) > 100:  # Keep last 100 values
                self.rsi_values = self.rsi_values[-100:]
        
        # Calculate SMAs
        sma_fast = self._calculate_sma(self.price_history, self.sma_fast)
        if sma_fast is not None:
            self.sma_fast_values.append(sma_fast)
            if len(self.sma_fast_values) > 100:
                self.sma_fast_values = self.sma_fast_values[-100:]
        
        sma_slow = self._calculate_sma(self.price_history, self.sma_slow)
        if sma_slow is not None:
            self.sma_slow_values.append(sma_slow)
            if len(self.sma_slow_values) > 100:
                self.sma_slow_values = self.sma_slow_values[-100:]

    def generate_signal(self, market_price: float) -> Optional[Order]:
        """Generate trading signal based on combined indicators.
        
        Strategy logic:
        1. RSI must be in oversold/overbought territory
        2. Fast SMA must cross above/below slow SMA
        3. Both conditions must be met for a signal
        """
        self._update_indicators(market_price)
        
        # Need at least 2 RSI values and 2 SMA values for comparison
        if (len(self.rsi_values) < 2 or 
            len(self.sma_fast_values) < 2 or 
            len(self.sma_slow_values) < 2):
            return None
        
        current_rsi = self.rsi_values[-1]
        previous_rsi = self.rsi_values[-2]
        
        current_sma_fast = self.sma_fast_values[-1]
        previous_sma_fast = self.sma_fast_values[-2]
        current_sma_slow = self.sma_slow_values[-1]
        previous_sma_slow = self.sma_slow_values[-2]
        
        # Check for bullish signal (buy)
        if (current_rsi <= self.rsi_oversold and  # RSI oversold
            previous_rsi > self.rsi_oversold and  # RSI was not oversold before
            current_sma_fast > current_sma_slow and  # Fast SMA above slow SMA
            previous_sma_fast <= previous_sma_slow):  # Fast SMA crossed above slow SMA
            return Order(
                symbol=self.symbol,
                side=OrderSide.BUY,
                quantity=self.quantity,
                price=market_price
            )
        
        # Check for bearish signal (sell)
        if (current_rsi >= self.rsi_overbought and  # RSI overbought
            previous_rsi < self.rsi_overbought and  # RSI was not overbought before
            current_sma_fast < current_sma_slow and  # Fast SMA below slow SMA
            previous_sma_fast >= previous_sma_slow):  # Fast SMA crossed below slow SMA
            return Order(
                symbol=self.symbol,
                side=OrderSide.SELL,
                quantity=self.quantity,
                price=market_price
            )
        
        return None

    def get_strategy_info(self) -> Dict[str, any]:
        """Get current strategy information and indicators."""
        return {
            "name": "Custom RSI + SMA Strategy",
            "symbol": self.symbol,
            "quantity": self.quantity,
            "parameters": {
                "rsi_period": self.rsi_period,
                "sma_fast": self.sma_fast,
                "sma_slow": self.sma_slow,
                "rsi_oversold": self.rsi_oversold,
                "rsi_overbought": self.rsi_overbought,
            },
            "current_indicators": {
                "rsi": self.rsi_values[-1] if self.rsi_values else None,
                "sma_fast": self.sma_fast_values[-1] if self.sma_fast_values else None,
                "sma_slow": self.sma_slow_values[-1] if self.sma_slow_values else None,
                "price": self.price_history[-1] if self.price_history else None,
            },
            "data_points": {
                "price_history_length": len(self.price_history),
                "rsi_values_length": len(self.rsi_values),
                "sma_fast_values_length": len(self.sma_fast_values),
                "sma_slow_values_length": len(self.sma_slow_values),
            }
        }










