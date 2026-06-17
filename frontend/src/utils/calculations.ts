/**
 * Financial calculation utilities for trading operations
 */

/**
 * Calculate profit/loss for a position
 */
export const calculatePnL = (
  entryPrice: number,
  currentPrice: number,
  quantity: number,
  side: 'buy' | 'sell'
): number => {
  if (side === 'buy') {
    return (currentPrice - entryPrice) * quantity;
  } else {
    return (entryPrice - currentPrice) * quantity;
  }
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (
  oldValue: number,
  newValue: number
): number => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Calculate position size based on risk percentage
 */
export const calculatePositionSize = (
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLossPrice: number
): number => {
  const riskAmount = accountBalance * (riskPercentage / 100);
  const priceRisk = Math.abs(entryPrice - stopLossPrice);
  
  if (priceRisk === 0) return 0;
  
  return riskAmount / priceRisk;
};

/**
 * Calculate Sharpe ratio
 */
export const calculateSharpeRatio = (
  returns: number[],
  riskFreeRate: number = 0.02
): number => {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const standardDeviation = Math.sqrt(variance);
  
  if (standardDeviation === 0) return 0;
  
  return (avgReturn - riskFreeRate) / standardDeviation;
};

/**
 * Calculate maximum drawdown
 */
export const calculateMaxDrawdown = (equityCurve: number[]): number => {
  if (equityCurve.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = equityCurve[0];
  
  for (let i = 1; i < equityCurve.length; i++) {
    if (equityCurve[i] > peak) {
      peak = equityCurve[i];
    } else {
      const drawdown = (peak - equityCurve[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown * 100; // Return as percentage
};

/**
 * Calculate win rate
 */
export const calculateWinRate = (trades: Array<{ pnl: number }>): number => {
  if (trades.length === 0) return 0;
  
  const winningTrades = trades.filter(trade => trade.pnl > 0).length;
  return (winningTrades / trades.length) * 100;
};

/**
 * Calculate profit factor
 */
export const calculateProfitFactor = (trades: Array<{ pnl: number }>): number => {
  if (trades.length === 0) return 0;
  
  const grossProfit = trades
    .filter(trade => trade.pnl > 0)
    .reduce((sum, trade) => sum + trade.pnl, 0);
    
  const grossLoss = Math.abs(trades
    .filter(trade => trade.pnl < 0)
    .reduce((sum, trade) => sum + trade.pnl, 0));
    
  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  
  return grossProfit / grossLoss;
};

/**
 * Calculate Value at Risk (VaR)
 */
export const calculateVaR = (
  returns: number[],
  confidenceLevel: number = 0.95
): number => {
  if (returns.length === 0) return 0;
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  
  return Math.abs(sortedReturns[index] || 0) * 100; // Return as percentage
};

/**
 * Calculate Simple Moving Average (SMA)
 */
export const calculateSMA = (values: number[], period: number): number[] => {
  if (values.length < period) return [];
  
  const sma: number[] = [];
  
  for (let i = period - 1; i < values.length; i++) {
    const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  
  return sma;
};

/**
 * Calculate Exponential Moving Average (EMA)
 */
export const calculateEMA = (values: number[], period: number): number[] => {
  if (values.length === 0) return [];
  
  const multiplier = 2 / (period + 1);
  const ema: number[] = [];
  
  // First EMA is the first value
  ema.push(values[0]);
  
  for (let i = 1; i < values.length; i++) {
    const currentEMA = (values[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    ema.push(currentEMA);
  }
  
  return ema;
};

/**
 * Calculate Relative Strength Index (RSI)
 */
export const calculateRSI = (values: number[], period: number = 14): number[] => {
  if (values.length < period + 1) return [];
  
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  // Calculate RSI for the first period
  if (avgLoss === 0) {
    rsi.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  // Calculate RSI for remaining periods
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
};

/**
 * Convert pips to price distance
 * For forex pairs, 1 pip = 0.0001 for most pairs, but 0.01 for JPY pairs
 * This is a simplified version - real implementation would need symbol-specific logic
 */
export const pipsToPriceDistance = (pips: number, symbol: string = "EURUSD"): number => {
  // JPY pairs have pip value of 0.01
  const isJpyPair = symbol.includes("JPY");
  const pipValue = isJpyPair ? 0.01 : 0.0001;
  return pips * pipValue;
};

/**
 * Get pip value for a symbol (simplified)
 */
export const getPipsFromPrice = (priceDistance: number, symbol: string = "EURUSD"): number => {
  const isJpyPair = symbol.includes("JPY");
  const pipValue = isJpyPair ? 0.01 : 0.0001;
  return priceDistance / pipValue;
};

/**
 * Calculate TP/SL price from mode value
 */
export const calculateTpSlPrice = (
  mode: "price" | "pips" | "money" | "percent",
  value: number,
  entryPrice: number,
  volume: number,
  symbol: string,
  equity: number,
  side: "buy" | "sell"
): number => {
  switch (mode) {
    case "price":
      return value;
    case "pips": {
      const distance = pipsToPriceDistance(value, symbol);
      return side === "buy" ? entryPrice + distance : entryPrice - distance;
    }
    case "money": {
      // Convert money to price distance (simplified: assumes 1 unit = 1 pip for now)
      return side === "buy" ? entryPrice + value : entryPrice - value;
    }
    case "percent": {
      const priceDistance = (equity * value) / 100 / volume;
      return side === "buy" ? entryPrice + priceDistance : entryPrice - priceDistance;
    }
    default:
      return value;
  }
};

/**
 * Calculate TP/SL value from price (reverse calculation)
 */
export const calculateTpSlValue = (
  price: number,
  entryPrice: number,
  symbol: string,
  volume: number,
  equity: number,
  mode: "price" | "pips" | "money" | "percent",
  side: "buy" | "sell"
): number => {
  const distance = Math.abs(price - entryPrice);
  
  switch (mode) {
    case "price":
      return price;
    case "pips":
      return getPipsFromPrice(distance, symbol);
    case "money":
      return distance;
    case "percent":
      return (distance * volume) / equity * 100;
    default:
      return price;
  }
};

export const calculateBollingerBands = (
  values: number[],
  period: number = 20,
  standardDeviations: number = 2
): { upper: number[]; middle: number[]; lower: number[] } => {
  const sma = calculateSMA(values, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const mean = sma[i - period + 1];
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    upper.push(mean + (standardDeviations * standardDeviation));
    lower.push(mean - (standardDeviations * standardDeviation));
  }

  return {
    upper,
    middle: sma,
    lower,
  };
};










