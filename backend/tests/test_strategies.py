from backend.strategies.sma_crossover import SMACrossoverStrategy
from backend.strategies.rsi_strategy import RSIStrategy


def test_sma_generates_signals():
    s = SMACrossoverStrategy(symbol="EURUSD", fast=2, slow=3)
    # Feed ascending prices: expect a buy when fast crosses above slow
    assert s.generate_signal(1.0) is None
    assert s.generate_signal(2.0) is None
    order = s.generate_signal(3.0)
    assert order is not None and order.side.value == "buy"


def test_rsi_generates_signals():
    s = RSIStrategy(symbol="EURUSD", period=2, oversold=30, overbought=70)
    # Oscillate to trigger signals
    assert s.generate_signal(100) is None
    assert s.generate_signal(50) is not None  # Likely oversold -> buy or sell depending on calc

