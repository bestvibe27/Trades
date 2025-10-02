/**
 * Trading timeframes and period definitions
 */

export const TIMEFRAMES = {
  M1: '1m',
  M5: '5m',
  M15: '15m',
  M30: '30m',
  H1: '1h',
  H4: '4h',
  D1: '1d',
  W1: '1w',
  MN1: '1M'
} as const;

export type Timeframe = typeof TIMEFRAMES[keyof typeof TIMEFRAMES];

export interface TimeframeConfig {
  timeframe: Timeframe;
  name: string;
  milliseconds: number;
  description: string;
}

export const TIMEFRAME_CONFIGS: Record<Timeframe, TimeframeConfig> = {
  [TIMEFRAMES.M1]: {
    timeframe: TIMEFRAMES.M1,
    name: '1 Minute',
    milliseconds: 60 * 1000,
    description: '1 minute candlestick'
  },
  [TIMEFRAMES.M5]: {
    timeframe: TIMEFRAMES.M5,
    name: '5 Minutes',
    milliseconds: 5 * 60 * 1000,
    description: '5 minute candlestick'
  },
  [TIMEFRAMES.M15]: {
    timeframe: TIMEFRAMES.M15,
    name: '15 Minutes',
    milliseconds: 15 * 60 * 1000,
    description: '15 minute candlestick'
  },
  [TIMEFRAMES.M30]: {
    timeframe: TIMEFRAMES.M30,
    name: '30 Minutes',
    milliseconds: 30 * 60 * 1000,
    description: '30 minute candlestick'
  },
  [TIMEFRAMES.H1]: {
    timeframe: TIMEFRAMES.H1,
    name: '1 Hour',
    milliseconds: 60 * 60 * 1000,
    description: '1 hour candlestick'
  },
  [TIMEFRAMES.H4]: {
    timeframe: TIMEFRAMES.H4,
    name: '4 Hours',
    milliseconds: 4 * 60 * 60 * 1000,
    description: '4 hour candlestick'
  },
  [TIMEFRAMES.D1]: {
    timeframe: TIMEFRAMES.D1,
    name: '1 Day',
    milliseconds: 24 * 60 * 60 * 1000,
    description: '1 day candlestick'
  },
  [TIMEFRAMES.W1]: {
    timeframe: TIMEFRAMES.W1,
    name: '1 Week',
    milliseconds: 7 * 24 * 60 * 60 * 1000,
    description: '1 week candlestick'
  },
  [TIMEFRAMES.MN1]: {
    timeframe: TIMEFRAMES.MN1,
    name: '1 Month',
    milliseconds: 30 * 24 * 60 * 60 * 1000,
    description: '1 month candlestick'
  }
};

export const getTimeframeConfig = (timeframe: Timeframe): TimeframeConfig => {
  return TIMEFRAME_CONFIGS[timeframe];
};

export const getTimeframeMilliseconds = (timeframe: Timeframe): number => {
  return getTimeframeConfig(timeframe).milliseconds;
};










