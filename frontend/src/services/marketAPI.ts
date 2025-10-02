import { get } from './api';

// Market Data API service
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
  contractSize?: number;
  marginRequirement?: number;
  commission?: number;
}

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

export interface MarketSentiment {
  symbol: string;
  bullish: number;
  bearish: number;
  neutral: number;
  fearGreedIndex: number;
  timestamp: string;
}

class MarketAPI {
  private baseUrl = '/market';

  /**
   * Get historical candle data
   */
  async getCandles(
    symbol: string,
    timeframe: string,
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<{ candles: Candle[] }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/candles/${symbol}/${timeframe}${queryString ? `?${queryString}` : ''}`;
    
    return get<{ candles: Candle[] }>(url);
  }

  /**
   * Get real-time quotes
   */
  async getQuotes(symbols: string[]): Promise<{ quotes: Quote[] }> {
    const symbolsParam = symbols.join(',');
    return get<{ quotes: Quote[] }>(`${this.baseUrl}/quotes?symbols=${symbolsParam}`);
  }

  /**
   * Get market overview
   */
  async getMarketOverview(): Promise<MarketOverview> {
    return get<MarketOverview>(`${this.baseUrl}/overview`);
  }

  /**
   * Get ticker information
   */
  async getTicker(symbol: string): Promise<Ticker> {
    return get<Ticker>(`${this.baseUrl}/ticker/${symbol}`);
  }

  /**
   * Get multiple tickers
   */
  async getTickers(symbols: string[]): Promise<{ tickers: Ticker[] }> {
    const symbolsParam = symbols.join(',');
    return get<{ tickers: Ticker[] }>(`${this.baseUrl}/tickers?symbols=${symbolsParam}`);
  }

  /**
   * Get symbol information
   */
  async getSymbolInfo(symbol: string): Promise<SymbolInfo> {
    return get<SymbolInfo>(`${this.baseUrl}/symbols/${symbol}`);
  }

  /**
   * Get all available symbols
   */
  async getSymbols(type?: string): Promise<{ symbols: SymbolInfo[] }> {
    const url = type ? `${this.baseUrl}/symbols?type=${type}` : `${this.baseUrl}/symbols`;
    return get<{ symbols: SymbolInfo[] }>(url);
  }

  /**
   * Get market statistics
   */
  async getMarketStats(symbol: string, timeframe: string): Promise<MarketStats> {
    return get<MarketStats>(`${this.baseUrl}/stats/${symbol}/${timeframe}`);
  }

  /**
   * Get economic calendar
   */
  async getEconomicCalendar(
    startDate?: string,
    endDate?: string,
    country?: string,
    importance?: string
  ): Promise<{ events: EconomicEvent[] }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (country) params.append('country', country);
    if (importance) params.append('importance', importance);
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/economic-calendar${queryString ? `?${queryString}` : ''}`;
    
    return get<{ events: EconomicEvent[] }>(url);
  }

  /**
   * Get market news
   */
  async getMarketNews(
    symbols?: string[],
    limit?: number,
    offset?: number
  ): Promise<{ news: MarketNews[]; total: number }> {
    const params = new URLSearchParams();
    if (symbols) params.append('symbols', symbols.join(','));
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/news${queryString ? `?${queryString}` : ''}`;
    
    return get<{ news: MarketNews[]; total: number }>(url);
  }

  /**
   * Get market sentiment
   */
  async getMarketSentiment(symbol: string): Promise<MarketSentiment> {
    return get<MarketSentiment>(`${this.baseUrl}/sentiment/${symbol}`);
  }

  /**
   * Get market sentiment for multiple symbols
   */
  async getMarketSentiments(symbols: string[]): Promise<{ sentiments: MarketSentiment[] }> {
    const symbolsParam = symbols.join(',');
    return get<{ sentiments: MarketSentiment[] }>(`${this.baseUrl}/sentiments?symbols=${symbolsParam}`);
  }

  /**
   * Get market depth (order book)
   */
  async getMarketDepth(symbol: string, limit?: number): Promise<any> {
    const url = limit ? `${this.baseUrl}/depth/${symbol}?limit=${limit}` : `${this.baseUrl}/depth/${symbol}`;
    return get<any>(url);
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(symbol: string, limit?: number): Promise<{ trades: any[] }> {
    const url = limit ? `${this.baseUrl}/trades/${symbol}?limit=${limit}` : `${this.baseUrl}/trades/${symbol}`;
    return get<{ trades: any[] }>(url);
  }

  /**
   * Get market hours
   */
  async getMarketHours(symbol: string): Promise<any> {
    return get<any>(`${this.baseUrl}/hours/${symbol}`);
  }

  /**
   * Get market status
   */
  async getMarketStatus(): Promise<{ status: string; message?: string }> {
    return get<{ status: string; message?: string }>(`${this.baseUrl}/status`);
  }

  /**
   * Get supported timeframes
   */
  async getTimeframes(): Promise<{ timeframes: string[] }> {
    return get<{ timeframes: string[] }>(`${this.baseUrl}/timeframes`);
  }

  /**
   * Get supported symbols by category
   */
  async getSymbolsByCategory(category: string): Promise<{ symbols: string[] }> {
    return get<{ symbols: string[] }>(`${this.baseUrl}/symbols/category/${category}`);
  }

  /**
   * Search symbols
   */
  async searchSymbols(query: string): Promise<{ symbols: SymbolInfo[] }> {
    return get<{ symbols: SymbolInfo[] }>(`${this.baseUrl}/symbols/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get price alerts
   */
  async getPriceAlerts(): Promise<{ alerts: any[] }> {
    return get<{ alerts: any[] }>(`${this.baseUrl}/alerts`);
  }

  /**
   * Create price alert
   */
  async createPriceAlert(alert: any): Promise<any> {
    return get<any>(`${this.baseUrl}/alerts`, { method: 'POST', body: JSON.stringify(alert) });
  }

  /**
   * Update price alert
   */
  async updatePriceAlert(alertId: string, updates: any): Promise<any> {
    return get<any>(`${this.baseUrl}/alerts/${alertId}`, { method: 'PUT', body: JSON.stringify(updates) });
  }

  /**
   * Delete price alert
   */
  async deletePriceAlert(alertId: string): Promise<void> {
    return get<void>(`${this.baseUrl}/alerts/${alertId}`, { method: 'DELETE' });
  }

  /**
   * Get market analysis
   */
  async getMarketAnalysis(symbol: string, timeframe: string): Promise<any> {
    return get<any>(`${this.baseUrl}/analysis/${symbol}/${timeframe}`);
  }

  /**
   * Get technical indicators
   */
  async getTechnicalIndicators(
    symbol: string,
    timeframe: string,
    indicators: string[]
  ): Promise<any> {
    const indicatorsParam = indicators.join(',');
    return get<any>(`${this.baseUrl}/indicators/${symbol}/${timeframe}?indicators=${indicatorsParam}`);
  }

  /**
   * Get market volatility
   */
  async getMarketVolatility(symbol: string, timeframe: string): Promise<any> {
    return get<any>(`${this.baseUrl}/volatility/${symbol}/${timeframe}`);
  }

  /**
   * Get correlation matrix
   */
  async getCorrelationMatrix(symbols: string[], timeframe: string): Promise<any> {
    const symbolsParam = symbols.join(',');
    return get<any>(`${this.baseUrl}/correlation?symbols=${symbolsParam}&timeframe=${timeframe}`);
  }
}

// Export singleton instance
export const marketAPI = new MarketAPI();
export default marketAPI;










