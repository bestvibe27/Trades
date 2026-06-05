from backend.core.trading_engine import TradingEngine
from backend.models.trade import Order, OrderSide
from backend.strategies.base_strategy import ThresholdStrategy


def test_engine_places_and_closes_positions():
    engine = TradingEngine()
    strat = ThresholdStrategy(symbol="EURUSD", buy_below=99, sell_above=101, quantity=1)

    # Should buy at 98
    order = engine.run_strategy_step(strat, 98)
    assert order is not None and order.side == OrderSide.BUY
    assert "EURUSD" in engine.open_positions

    # Should sell at 102
    order = engine.run_strategy_step(strat, 102)
    assert order is not None and order.side == OrderSide.SELL
    assert "EURUSD" not in engine.open_positions
    assert len(engine.completed_trades) == 1


