/**
 * Trading strategy constants and configurations
 */

export const STRATEGY_TYPES = {
  SMA_CROSSOVER: 'sma_crossover',
  RSI_MEAN_REVERSION: 'rsi_mean_reversion',
  BOLLINGER_BANDS: 'bollinger_bands',
  MACD: 'macd',
  CUSTOM: 'custom'
} as const;

export type StrategyType = typeof STRATEGY_TYPES[keyof typeof STRATEGY_TYPES];

export const STRATEGY_DEFAULTS = {
  [STRATEGY_TYPES.SMA_CROSSOVER]: {
    fastPeriod: 10,
    slowPeriod: 30,
    timeframe: '1h'
  },
  [STRATEGY_TYPES.RSI_MEAN_REVERSION]: {
    period: 14,
    overbought: 70,
    oversold: 30,
    timeframe: '4h'
  },
  [STRATEGY_TYPES.BOLLINGER_BANDS]: {
    period: 20,
    stdDev: 2,
    timeframe: '1h'
  },
  [STRATEGY_TYPES.MACD]: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    timeframe: '1h'
  }
} as const;

export const STRATEGY_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  ERROR: 'error'
} as const;

export type StrategyStatus = typeof STRATEGY_STATUS[keyof typeof STRATEGY_STATUS];










