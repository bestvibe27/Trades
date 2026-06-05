/**
 * TypeScript type definitions for market data structures
 */

// Basic market data types
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

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: string;
}

export interface Ticker {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  open24h: number;
  timestamp: string;
}

// Market overview
export interface MarketOverview {
  symbols: MarketSymbol[];
  lastUpdate: string;
  marketStatus: 'open' | 'closed' | 'pre_market' | 'post_market';
}

export interface MarketSymbol {
  symbol: string;
  name: string;
  type: 'forex' | 'crypto' | 'commodity' | 'index' | 'stock';
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  open24h: number;
  lastUpdate: string;
  isActive: boolean;
}

// Technical indicators
export interface TechnicalIndicator {
  name: string;
  value: number;
  signal?: 'buy' | 'sell' | 'neutral';
  strength?: number; // 0-100
  timestamp: string;
}

export interface MovingAverage {
  period: number;
  value: number;
  type: 'SMA' | 'EMA' | 'WMA';
  timestamp: string;
}

export interface RSI {
  period: number;
  value: number;
  signal: 'overbought' | 'oversold' | 'neutral';
  timestamp: string;
}

export interface MACD {
  macd: number;
  signal: number;
  histogram: number;
  timestamp: string;
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  timestamp: string;
}

// Market depth
export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: string;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  orders?: number;
}

// Market statistics
export interface MarketStats {
  symbol: string;
  timeframe: string;
  volatility: number;
  averageVolume: number;
  priceRange: {
    high: number;
    low: number;
    range: number;
    rangePercent: number;
  };
  supportResistance: {
    support: number[];
    resistance: number[];
  };
  timestamp: string;
}

// Economic calendar
export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  importance: 'low' | 'medium' | 'high';
  actual?: number;
  forecast?: number;
  previous?: number;
  unit?: string;
  timestamp: string;
  impact: 'positive' | 'negative' | 'neutral';
}

// Market sentiment
export interface MarketSentiment {
  symbol: string;
  bullish: number; // 0-100
  bearish: number; // 0-100
  neutral: number; // 0-100
  fearGreedIndex: number; // 0-100
  timestamp: string;
}

// News
export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
  symbols: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'low' | 'medium' | 'high';
}

// Market hours
export interface MarketHours {
  symbol: string;
  timezone: string;
  sessions: MarketSession[];
}

export interface MarketSession {
  name: string;
  open: string; // HH:MM format
  close: string; // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday)
  isActive: boolean;
}

// Symbol information
export interface SymbolInfo {
  symbol: string;
  name: string;
  type: 'forex' | 'crypto' | 'commodity' | 'index' | 'stock';
  baseCurrency: string;
  quoteCurrency: string;
  minQuantity: number;
  maxQuantity: number;
  stepSize: number;
  minPrice: number;
  maxPrice: number;
  tickSize: number;
  isActive: boolean;
  tradingHours: MarketHours;
  contractSize?: number;
  marginRequirement?: number;
  commission?: number;
}

// Price alerts
export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below' | 'crosses_above' | 'crosses_below';
  price: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  message?: string;
}

// Market data subscription
export interface MarketDataSubscription {
  symbol: string;
  dataTypes: ('candles' | 'quotes' | 'trades' | 'orderbook')[];
  timeframe?: string;
  isActive: boolean;
}

// Historical data request
export interface HistoricalDataRequest {
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  limit?: number;
  dataType: 'candles' | 'quotes' | 'trades';
}

// Real-time data feed
export interface RealTimeDataFeed {
  symbol: string;
  dataType: 'candles' | 'quotes' | 'trades' | 'orderbook';
  data: any;
  timestamp: string;
}

// Market analysis
export interface MarketAnalysis {
  symbol: string;
  timeframe: string;
  trend: 'bullish' | 'bearish' | 'sideways';
  strength: number; // 0-100
  support: number[];
  resistance: number[];
  keyLevels: {
    price: number;
    type: 'support' | 'resistance' | 'pivot';
    strength: number;
  }[];
  indicators: TechnicalIndicator[];
  summary: string;
  timestamp: string;
}










