import { get, post } from './api';

// Trading API service
export interface Order {
  id: string;
  clientOrderId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  status: 'pending' | 'filled' | 'cancelled' | 'rejected' | 'partially_filled';
  filledQuantity: number;
  remainingQuantity: number;
  averagePrice?: number;
  commission?: number;
  createdAt: string;
  updatedAt: string;
  filledAt?: string;
  cancelledAt?: string;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  margin: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: string;
  updatedAt: string;
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  commission: number;
  pnl: number;
  timestamp: string;
  strategyId?: string;
}

export interface PortfolioSummary {
  totalEquity: number;
  availableBalance: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: Position[];
  lastUpdate: string;
}

export interface PlaceOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  clientOrderId?: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface PlaceOrderResponse {
  orderId: string;
  clientOrderId?: string;
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  price?: number;
  status: string;
  timestamp: string;
}

export interface AccountInfo {
  accountId: string;
  accountType: 'demo' | 'live';
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  leverage: number;
  isActive: boolean;
  lastUpdate: string;
}

class TradingAPI {
  private baseUrl = '/trading';
  private brokerUrl = '/broker';

  /**
   * Place a new order
   */
  async placeOrder(orderRequest: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    return post<PlaceOrderResponse>(`${this.baseUrl}/order`, orderRequest);
  }

  // --- Broker (MT5) endpoints ---
  async getBrokerStatus(): Promise<{ connected: boolean; account: any; last_error: string }>{
    return get(`${this.brokerUrl}/status`);
  }

  async getBrokerQuote(symbol: string): Promise<{ symbol: string; last: number; bid: number; ask: number }>{
    return get(`${this.brokerUrl}/quote/${encodeURIComponent(symbol)}`);
  }

  async placeBrokerMarketOrder(params: { symbol: string; side: 'buy'|'sell'; volume: number; sl?: number; tp?: number; comment?: string }): Promise<any> {
    return post(`${this.brokerUrl}/order/market`, params);
  }

  async getBrokerAccount(): Promise<{ balance: number; equity: number; free_margin: number }>{
    return get(`${this.brokerUrl}/account`);
  }

  async getBrokerSymbols(): Promise<{ symbols: string[] }>{
    return get(`${this.brokerUrl}/symbols`);
  }

  async getBrokerSymbolInfo(symbol: string): Promise<{ symbol: string; found: boolean; digits?: number; volume_min?: number; volume_step?: number; volume_max?: number }>{
    return get(`${this.brokerUrl}/symbols/${encodeURIComponent(symbol)}`);
  }

  async getBrokerPositions(): Promise<{ positions: Array<{ symbol: string; volume: number; price_open: number; price_current: number; profit: number }>}>{
    return get(`${this.brokerUrl}/positions`);
  }

  async getBrokerTrades(limit = 20): Promise<{ trades: Array<{ id: number; symbol: string; side: string; volume: number; price: number; time: string }>}>{
    return get(`${this.brokerUrl}/trades?limit=${limit}`);
  }

  async getBrokerDatabaseTrades(limit = 20): Promise<{ trades: Array<{ trade_id: number; symbol: string; side: string; volume: number; open_price: number; execution_price: number; status: string; execution_time: string; profit_loss?: number; commission: number; source: string }>; total: number }>{
    return get(`${this.brokerUrl}/trades/database?limit=${limit}`);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    return post<void>(`${this.baseUrl}/orders/${orderId}/cancel`, {});
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    return get<Order>(`${this.baseUrl}/orders/${orderId}`);
  }

  /**
   * Get all orders
   */
  async getOrders(
    symbol?: string,
    status?: string,
    limit?: number,
    offset?: number
  ): Promise<{ orders: Order[]; total: number }> {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/orders${queryString ? `?${queryString}` : ''}`;
    
    return get<{ orders: Order[]; total: number }>(url);
  }

  /**
   * Get open orders
   */
  async getOpenOrders(symbol?: string): Promise<{ orders: Order[] }> {
    const url = symbol ? `${this.baseUrl}/orders/open?symbol=${symbol}` : `${this.baseUrl}/orders/open`;
    return get<{ orders: Order[] }>(url);
  }

  /**
   * Get order history
   */
  async getOrderHistory(
    symbol?: string,
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<{ orders: Order[]; total: number }> {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/orders/history${queryString ? `?${queryString}` : ''}`;
    
    return get<{ orders: Order[]; total: number }>(url);
  }

  /**
   * Get all positions
   */
  async getPositions(symbol?: string): Promise<{ positions: Position[] }> {
    const url = symbol ? `${this.baseUrl}/positions?symbol=${symbol}` : `${this.baseUrl}/positions`;
    return get<{ positions: Position[] }>(url);
  }

  /**
   * Get position by ID
   */
  async getPosition(positionId: string): Promise<Position> {
    return get<Position>(`${this.baseUrl}/positions/${positionId}`);
  }

  /**
   * Close a position
   */
  async closePosition(positionId: string, quantity?: number): Promise<void> {
    const body = quantity ? { quantity } : {};
    return post<void>(`${this.baseUrl}/positions/${positionId}/close`, body);
  }

  /**
   * Update position stop loss
   */
  async updateStopLoss(positionId: string, stopLoss: number): Promise<void> {
    return post<void>(`${this.baseUrl}/positions/${positionId}/stop-loss`, { stopLoss });
  }

  /**
   * Update position take profit
   */
  async updateTakeProfit(positionId: string, takeProfit: number): Promise<void> {
    return post<void>(`${this.baseUrl}/positions/${positionId}/take-profit`, { takeProfit });
  }

  /**
   * Get all trades
   */
  async getTrades(
    symbol?: string,
    startDate?: string,
    endDate?: string,
    limit?: number,
    offset?: number
  ): Promise<{ trades: Trade[]; total: number }> {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/trades${queryString ? `?${queryString}` : ''}`;
    
    return get<{ trades: Trade[]; total: number }>(url);
  }

  /**
   * Get trade by ID
   */
  async getTrade(tradeId: string): Promise<Trade> {
    return get<Trade>(`${this.baseUrl}/trades/${tradeId}`);
  }

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    return get<PortfolioSummary>(`${this.baseUrl}/portfolio/summary`);
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    return get<AccountInfo>(`${this.baseUrl}/account`);
  }

  /**
   * Get trading statistics
   */
  async getTradingStats(
    period?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/stats${queryString ? `?${queryString}` : ''}`;
    
    return get<any>(url);
  }

  /**
   * Get trading performance
   */
  async getTradingPerformance(
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/performance${queryString ? `?${queryString}` : ''}`;
    
    return get<any>(url);
  }

  /**
   * Get risk metrics
   */
  async getRiskMetrics(): Promise<any> {
    return get<any>(`${this.baseUrl}/risk/metrics`);
  }

  /**
   * Get margin requirements
   */
  async getMarginRequirements(symbol: string): Promise<any> {
    return get<any>(`${this.baseUrl}/margin/${symbol}`);
  }

  /**
   * Get trading fees
   */
  async getTradingFees(symbol: string): Promise<any> {
    return get<any>(`${this.baseUrl}/fees/${symbol}`);
  }

  /**
   * Get market data for trading
   */
  async getTradingMarketData(symbol: string): Promise<any> {
    return get<any>(`${this.baseUrl}/market-data/${symbol}`);
  }

  /**
   * Get trading hours
   */
  async getTradingHours(symbol: string): Promise<any> {
    return get<any>(`${this.baseUrl}/hours/${symbol}`);
  }

  /**
   * Check if market is open
   */
  async isMarketOpen(symbol: string): Promise<{ isOpen: boolean; nextOpen?: string; nextClose?: string }> {
    return get<{ isOpen: boolean; nextOpen?: string; nextClose?: string }>(`${this.baseUrl}/market-status/${symbol}`);
  }

  /**
   * Get order book
   */
  async getOrderBook(symbol: string, limit?: number): Promise<any> {
    const url = limit ? `${this.baseUrl}/orderbook/${symbol}?limit=${limit}` : `${this.baseUrl}/orderbook/${symbol}`;
    return get<any>(url);
  }

  /**
   * Get recent trades for symbol
   */
  async getRecentTrades(symbol: string, limit?: number): Promise<{ trades: any[] }> {
    const url = limit ? `${this.baseUrl}/recent-trades/${symbol}?limit=${limit}` : `${this.baseUrl}/recent-trades/${symbol}`;
    return get<{ trades: any[] }>(url);
  }

  /**
   * Get trading limits
   */
  async getTradingLimits(): Promise<any> {
    return get<any>(`${this.baseUrl}/limits`);
  }

  /**
   * Update trading limits
   */
  async updateTradingLimits(limits: any): Promise<any> {
    return post<any>(`${this.baseUrl}/limits`, limits);
  }

  /**
   * Get trading alerts
   */
  async getTradingAlerts(): Promise<{ alerts: any[] }> {
    return get<{ alerts: any[] }>(`${this.baseUrl}/alerts`);
  }

  /**
   * Create trading alert
   */
  async createTradingAlert(alert: any): Promise<any> {
    return post<any>(`${this.baseUrl}/alerts`, alert);
  }

  /**
   * Update trading alert
   */
  async updateTradingAlert(alertId: string, updates: any): Promise<any> {
    return post<any>(`${this.baseUrl}/alerts/${alertId}`, updates);
  }

  /**
   * Delete trading alert
   */
  async deleteTradingAlert(alertId: string): Promise<void> {
    return post<void>(`${this.baseUrl}/alerts/${alertId}/delete`, {});
  }

  /**
   * Get trading notifications
   */
  async getTradingNotifications(): Promise<{ notifications: any[] }> {
    return get<{ notifications: any[] }>(`${this.baseUrl}/notifications`);
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    return post<void>(`${this.baseUrl}/notifications/${notificationId}/read`, {});
  }

  /**
   * Get trading session info
   */
  async getTradingSession(): Promise<any> {
    return get<any>(`${this.baseUrl}/session`);
  }

  /**
   * End trading session
   */
  async endTradingSession(): Promise<void> {
    return post<void>(`${this.baseUrl}/session/end`, {});
  }
}

// Export singleton instance
export const tradingAPI = new TradingAPI();
export default tradingAPI;










