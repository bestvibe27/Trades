/**
 * TypeScript type definitions for trading-related data structures
 */

// Order types
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

// Position types
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

// Trade types
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

// Portfolio types
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

export interface PortfolioPerformance {
  totalReturn: number;
  totalReturnPercent: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
}

// Strategy types
export interface Strategy {
  id: string;
  name: string;
  type: string;
  symbol: string;
  timeframe: string;
  parameters: Record<string, any>;
  isActive: boolean;
  isRunning: boolean;
  performance: StrategyPerformance;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  stoppedAt?: string;
}

export interface StrategyPerformance {
  totalReturn: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  lastUpdate: string;
}

// Risk management
export interface RiskMetrics {
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  var95: number;
  var99: number;
  winRate: number;
  profitFactor: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  totalTrades: number;
  lastUpdate: string;
}

export interface RiskLimits {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxConcurrentPositions: number;
  maxLeverage: number;
  stopLossPercent: number;
  takeProfitPercent: number;
}

// Backtesting
export interface BacktestConfig {
  strategyId: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  commission: number;
  slippage: number;
  parameters: Record<string, any>;
}

export interface BacktestResults {
  backtestId: string;
  config: BacktestConfig;
  performance: PortfolioPerformance;
  equityCurve: EquityPoint[];
  trades: Trade[];
  metrics: RiskMetrics;
  status: 'completed' | 'failed' | 'running';
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
  trades: number;
}

// Trading session
export interface TradingSession {
  id: string;
  strategyId: string;
  symbol: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'paused' | 'stopped';
  trades: number;
  pnl: number;
  orders: Order[];
  positions: Position[];
}

// Market conditions
export interface MarketCondition {
  symbol: string;
  volatility: 'low' | 'medium' | 'high';
  trend: 'bullish' | 'bearish' | 'sideways';
  volume: 'low' | 'medium' | 'high';
  spread: number;
  liquidity: 'low' | 'medium' | 'high';
  timestamp: string;
}

// Trading signals
export interface TradingSignal {
  id: string;
  symbol: string;
  timeframe: string;
  signal: 'buy' | 'sell' | 'hold';
  strength: number; // 0-100
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence: number; // 0-100
  indicators: {
    name: string;
    value: number;
    signal: 'buy' | 'sell' | 'neutral';
  }[];
  timestamp: string;
  strategyId?: string;
}

// Order book
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

// Trade execution
export interface TradeExecution {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  commission: number;
  timestamp: string;
  executionType: 'market' | 'limit' | 'stop';
  slippage?: number;
}

// Account information
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

// Trading statistics
export interface TradingStats {
  period: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  startDate: string;
  endDate: string;
}

// Notification types
export interface TradingNotification {
  id: string;
  type: 'order_filled' | 'order_cancelled' | 'stop_loss' | 'take_profit' | 'margin_call' | 'strategy_signal';
  title: string;
  message: string;
  symbol?: string;
  orderId?: string;
  positionId?: string;
  strategyId?: string;
  isRead: boolean;
  createdAt: string;
}










