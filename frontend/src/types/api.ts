/**
 * TypeScript type definitions for API requests and responses
 */

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Health check
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
    broker: 'connected' | 'disconnected';
  };
}

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// User
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  timezone?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  trading: {
    defaultSymbol: string;
    defaultTimeframe: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

// Market Data
export interface MarketDataRequest {
  symbol: string;
  timeframe: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface MarketOverviewResponse {
  symbols: MarketSymbol[];
  lastUpdate: string;
}

export interface MarketSymbol {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  lastUpdate: string;
}

// Trading
export interface PlaceOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  clientOrderId?: string;
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

export interface CancelOrderRequest {
  orderId: string;
}

export interface CancelOrderResponse {
  orderId: string;
  status: string;
  timestamp: string;
}

// Portfolio
export interface PortfolioSummaryResponse {
  totalEquity: number;
  availableBalance: number;
  usedMargin: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  performance: PortfolioPerformance;
  lastUpdate: string;
}

export interface PortfolioPerformance {
  totalReturn: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
}

// Strategies
export interface StrategyListResponse {
  strategies: Strategy[];
  total: number;
}

export interface CreateStrategyRequest {
  name: string;
  type: string;
  symbol: string;
  timeframe: string;
  parameters: Record<string, any>;
  isActive: boolean;
}

export interface UpdateStrategyRequest {
  name?: string;
  parameters?: Record<string, any>;
  isActive?: boolean;
}

export interface BacktestRequest {
  strategyId: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  parameters?: Record<string, any>;
}

export interface BacktestResponse {
  backtestId: string;
  status: 'running' | 'completed' | 'failed';
  results?: BacktestResults;
  error?: string;
}

export interface BacktestResults {
  totalReturn: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  equityCurve: Array<{
    date: string;
    equity: number;
    drawdown: number;
  }>;
  trades: Array<{
    id: string;
    symbol: string;
    side: string;
    quantity: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    entryTime: string;
    exitTime: string;
  }>;
}

// Error responses
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationErrorResponse {
  code: 'VALIDATION_ERROR';
  message: string;
  errors: ValidationError[];
  timestamp: string;
}

// WebSocket messages
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

export interface PriceUpdateMessage {
  type: 'price_update';
  data: {
    symbol: string;
    price: number;
    timestamp: string;
  };
}

export interface OrderUpdateMessage {
  type: 'order_update';
  data: {
    orderId: string;
    status: string;
    filledQuantity?: number;
    remainingQuantity?: number;
    timestamp: string;
  };
}

export interface PositionUpdateMessage {
  type: 'position_update';
  data: {
    symbol: string;
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
    timestamp: string;
  };
}

export interface TradeUpdateMessage {
  type: 'trade_update';
  data: {
    tradeId: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    pnl: number;
    timestamp: string;
  };
}

export interface ErrorMessage {
  type: 'error';
  data: {
    code: string;
    message: string;
    timestamp: string;
  };
}

export interface HeartbeatMessage {
  type: 'heartbeat';
  data: {
    timestamp: string;
  };
}










