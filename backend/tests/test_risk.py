from backend.risk.position_sizer import fixed_fractional
from backend.risk.drawdown_control import max_drawdown


def test_fixed_fractional():
    qty = fixed_fractional(10000, 0.01, 10)
    assert round(qty, 2) == 10.0


def test_max_drawdown():
    dd = max_drawdown([100, 120, 90, 95, 80, 110])
    assert dd < 0

