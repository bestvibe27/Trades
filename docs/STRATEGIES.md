# Trading Strategies Documentation

## Overview

The trading bot supports multiple strategy types with a modular architecture. Strategies are implemented as Python classes that inherit from the `BaseStrategy` class and implement the `generate_signal` method.

## Strategy Architecture

### Base Strategy Class

All strategies inherit from `BaseStrategy`:

```python
from backend.strategies.base_strategy import BaseStrategy

class MyStrategy(BaseStrategy):
    def __init__(self, symbol: str, quantity: float = 1.0):
        super().__init__(symbol, quantity)
        # Initialize strategy parameters
    
    def generate_signal(self, market_price: float) -> Optional[Order]:
        # Implement strategy logic
        # Return Order object or None
        pass
```

### Strategy Interface

The `generate_signal` method should:
- Take the current market price as input
- Return an `Order` object if a signal is generated
- Return `None` if no signal is generated
- Handle all strategy-specific logic internally

## Built-in Strategies

### 1. SMA Crossover Strategy

**Description**: Generates buy/sell signals when a fast moving average crosses above/below a slow moving average.

**Parameters**:
- `fast` (int): Fast SMA period (default: 10)
- `slow` (int): Slow SMA period (default: 30)
- `quantity` (float): Position size (default: 1.0)

**Logic**:
- Buy signal: Fast SMA crosses above slow SMA
- Sell signal: Fast SMA crosses below slow SMA

**Usage**:
```python
from backend.strategies.sma_crossover import SMACrossoverStrategy

strategy = SMACrossoverStrategy(
    symbol="EURUSD",
    fast=10,
    slow=30,
    quantity=1.0
)

signal = strategy.generate_signal(1.0950)
```

### 2. RSI Mean Reversion Strategy

**Description**: Generates buy/sell signals based on RSI overbought/oversold conditions.

**Parameters**:
- `period` (int): RSI calculation period (default: 14)
- `oversold` (float): Oversold threshold (default: 30)
- `overbought` (float): Overbought threshold (default: 70)
- `quantity` (float): Position size (default: 1.0)

**Logic**:
- Buy signal: RSI <= oversold threshold
- Sell signal: RSI >= overbought threshold

**Usage**:
```python
from backend.strategies.rsi_strategy import RSIStrategy

strategy = RSIStrategy(
    symbol="EURUSD",
    period=14,
    oversold=30,
    overbought=70,
    quantity=1.0
)

signal = strategy.generate_signal(1.0950)
```

### 3. Custom Strategy

**Description**: Combines multiple indicators (RSI + SMA crossover) for more sophisticated signals.

**Parameters**:
- `rsi_period` (int): RSI period (default: 14)
- `sma_fast` (int): Fast SMA period (default: 10)
- `sma_slow` (int): Slow SMA period (default: 30)
- `rsi_oversold` (float): RSI oversold level (default: 30)
- `rsi_overbought` (float): RSI overbought level (default: 70)
- `quantity` (float): Position size (default: 1.0)

**Logic**:
- Buy signal: RSI oversold AND fast SMA crosses above slow SMA
- Sell signal: RSI overbought AND fast SMA crosses below slow SMA

**Usage**:
```python
from backend.strategies.custom_strategy import CustomStrategy

strategy = CustomStrategy(
    symbol="EURUSD",
    rsi_period=14,
    sma_fast=10,
    sma_slow=30,
    rsi_oversold=30,
    rsi_overbought=70,
    quantity=1.0
)

signal = strategy.generate_signal(1.0950)
```

## Creating Custom Strategies

### Step 1: Define Strategy Class

```python
from backend.strategies.base_strategy import BaseStrategy
from backend.models.trade import Order, OrderSide
from typing import Optional

class MyCustomStrategy(BaseStrategy):
    def __init__(self, symbol: str, param1: float, param2: int, quantity: float = 1.0):
        super().__init__(symbol, quantity)
        self.param1 = param1
        self.param2 = param2
        # Initialize any internal state
        
    def generate_signal(self, market_price: float) -> Optional[Order]:
        # Implement your strategy logic here
        if self._should_buy(market_price):
            return Order(
                symbol=self.symbol,
                side=OrderSide.BUY,
                quantity=self.quantity,
                price=market_price
            )
        elif self._should_sell(market_price):
            return Order(
                symbol=self.symbol,
                side=OrderSide.SELL,
                quantity=self.quantity,
                price=market_price
            )
        return None
    
    def _should_buy(self, price: float) -> bool:
        # Implement buy condition logic
        pass
    
    def _should_sell(self, price: float) -> bool:
        # Implement sell condition logic
        pass
```

### Step 2: Add Strategy to System

1. **Add to strategies module**:
```python
# In backend/strategies/__init__.py
from backend.strategies.my_custom_strategy import MyCustomStrategy

__all__ = [
    "BaseStrategy",
    "SMACrossoverStrategy",
    "RSIStrategy",
    "CustomStrategy",
    "MyCustomStrategy"  # Add your strategy
]
```

2. **Add to API endpoints**:
```python
# In backend/app/strategies.py
@router.post("/my-custom/preview")
async def my_custom_preview(cfg: MyCustomConfig) -> dict:
    strategy = MyCustomStrategy(cfg.symbol, cfg.param1, cfg.param2)
    return {"name": "my_custom", "symbol": cfg.symbol}
```

3. **Add to frontend**:
```typescript
// In frontend/src/pages/strategies.tsx
<option value="my_custom">My Custom Strategy</option>
```

## Technical Indicators

### Available Indicators

The system provides several technical indicators in `backend/utils/indicators.py`:

#### Simple Moving Average (SMA)
```python
from backend.utils.indicators import simple_moving_average

prices = [1.0950, 1.0955, 1.0960, 1.0958, 1.0962]
sma_values = simple_moving_average(prices, window=3)
# Returns: [None, None, 1.0955, 1.0958, 1.0960]
```

#### Exponential Moving Average (EMA)
```python
from backend.utils.indicators import exponential_moving_average

prices = [1.0950, 1.0955, 1.0960, 1.0958, 1.0962]
ema_values = exponential_moving_average(prices, window=3)
# Returns: [1.0950, 1.0952, 1.0956, 1.0957, 1.0959]
```

#### RSI (Relative Strength Index)
```python
from backend.strategies.rsi_strategy import compute_rsi
from collections import deque

prices = deque([1.0950, 1.0955, 1.0960, 1.0958, 1.0962], maxlen=15)
rsi = compute_rsi(prices, period=14)
# Returns: RSI value between 0-100
```

### Creating Custom Indicators

```python
def my_custom_indicator(prices: List[float], period: int) -> List[float]:
    """Calculate a custom technical indicator."""
    result = []
    for i in range(len(prices)):
        if i < period - 1:
            result.append(None)
        else:
            # Calculate indicator value
            value = sum(prices[i-period+1:i+1]) / period
            result.append(value)
    return result
```

## Strategy Configuration

### Configuration Files

Strategies can be configured through YAML files:

```yaml
# config/strategies.yml
strategies:
  sma_crossover:
    enabled: true
    symbol: "EURUSD"
    timeframe: "1h"
    parameters:
      fast: 10
      slow: 30
      quantity: 1.0
  
  rsi_strategy:
    enabled: true
    symbol: "GBPUSD"
    timeframe: "4h"
    parameters:
      period: 14
      oversold: 30
      overbought: 70
      quantity: 1.0
```

### Runtime Configuration

Strategies can be configured at runtime through the API:

```python
# Create strategy with custom parameters
strategy = SMACrossoverStrategy(
    symbol="EURUSD",
    fast=5,      # Custom fast period
    slow=20,     # Custom slow period
    quantity=0.5 # Custom position size
)
```

## Strategy Testing

### Unit Testing

```python
import pytest
from backend.strategies.sma_crossover import SMACrossoverStrategy

def test_sma_crossover_buy_signal():
    strategy = SMACrossoverStrategy("EURUSD", fast=2, slow=3)
    
    # Feed ascending prices to trigger buy signal
    assert strategy.generate_signal(1.0) is None
    assert strategy.generate_signal(2.0) is None
    signal = strategy.generate_signal(3.0)
    
    assert signal is not None
    assert signal.side.value == "buy"
    assert signal.symbol == "EURUSD"
```

### Backtesting

Use the backtesting framework to test strategies:

```python
from backend.data.data_provider import MockDataProvider
from backend.strategies.sma_crossover import SMACrossoverStrategy

# Get historical data
provider = MockDataProvider()
data = provider.get_historical_candles("EURUSD", "1h", 1000)

# Create strategy
strategy = SMACrossoverStrategy("EURUSD", fast=10, slow=30)

# Run backtest
results = backtest_strategy(strategy, data)
print(f"Total return: {results['total_return']:.2f}%")
print(f"Max drawdown: {results['max_drawdown']:.2f}%")
```

## Performance Optimization

### Efficient Price History Management

```python
from collections import deque

class OptimizedStrategy(BaseStrategy):
    def __init__(self, symbol: str, lookback: int = 100):
        super().__init__(symbol)
        # Use deque for efficient price history
        self.price_history = deque(maxlen=lookback)
    
    def generate_signal(self, market_price: float) -> Optional[Order]:
        self.price_history.append(market_price)
        # Strategy logic here
        pass
```

### Caching Calculations

```python
from functools import lru_cache

class CachedStrategy(BaseStrategy):
    @lru_cache(maxsize=128)
    def _calculate_indicator(self, price_tuple: tuple) -> float:
        """Cache indicator calculations for repeated price sequences."""
        # Expensive calculation here
        return result
```

## Best Practices

### 1. Strategy Design
- Keep strategies simple and focused
- Use clear, descriptive parameter names
- Implement proper error handling
- Add comprehensive logging

### 2. Performance
- Use efficient data structures (deque for price history)
- Cache expensive calculations
- Limit historical data storage
- Optimize for real-time execution

### 3. Testing
- Write unit tests for all strategies
- Test edge cases and error conditions
- Use backtesting to validate performance
- Monitor strategy performance in production

### 4. Risk Management
- Implement position sizing
- Add stop-loss and take-profit logic
- Monitor drawdown and risk metrics
- Use circuit breakers for extreme conditions

### 5. Monitoring
- Log all trading decisions
- Track strategy performance metrics
- Monitor for strategy drift
- Set up alerts for unusual behavior

## Common Patterns

### Trend Following
```python
def trend_following_signal(self, price: float) -> Optional[Order]:
    if self.price_history[-1] > self.price_history[-2] > self.price_history[-3]:
        return Order(symbol=self.symbol, side=OrderSide.BUY, quantity=self.quantity, price=price)
    elif self.price_history[-1] < self.price_history[-2] < self.price_history[-3]:
        return Order(symbol=self.symbol, side=OrderSide.SELL, quantity=self.quantity, price=price)
    return None
```

### Mean Reversion
```python
def mean_reversion_signal(self, price: float) -> Optional[Order]:
    sma = sum(self.price_history) / len(self.price_history)
    if price < sma * 0.98:  # 2% below mean
        return Order(symbol=self.symbol, side=OrderSide.BUY, quantity=self.quantity, price=price)
    elif price > sma * 1.02:  # 2% above mean
        return Order(symbol=self.symbol, side=OrderSide.SELL, quantity=self.quantity, price=price)
    return None
```

### Breakout
```python
def breakout_signal(self, price: float) -> Optional[Order]:
    resistance = max(self.price_history[-20:])  # 20-period high
    support = min(self.price_history[-20:])     # 20-period low
    
    if price > resistance:
        return Order(symbol=self.symbol, side=OrderSide.BUY, quantity=self.quantity, price=price)
    elif price < support:
        return Order(symbol=self.symbol, side=OrderSide.SELL, quantity=self.quantity, price=price)
    return None
```










