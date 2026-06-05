/**
 * Market data type definitions
 */

export interface Candle {
  symbol: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface Tick {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: string;
}

export interface Quote {
  symbol: string;
  price: number;
  timestamp: string;
}

export interface CandleSeries {
  symbol: string;
  timeframe: string;
  candles: Candle[];
}

export interface MarketDataRequest {
  symbol: string;
  timeframe: string;
  limit?: number;
  startTime?: string;
  endTime?: string;
}

export interface MarketDataResponse {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  metadata: {
    total: number;
    startTime: string;
    endTime: string;
  };
}

export interface SymbolInfo {
  symbol: string;
  name: string;
  category: string;
  baseCurrency: string;
  quoteCurrency: string;
  minLotSize: number;
  maxLotSize: number;
  lotStep: number;
  tickSize: number;
  tickValue: number;
  spread: number;
  enabled: boolean;
}

export interface MarketStatus {
  isOpen: boolean;
  nextOpen?: string;
  nextClose?: string;
  timezone: string;
}










