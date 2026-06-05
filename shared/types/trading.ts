/**
 * Trading-related type definitions
 */

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type OrderStatus = 'new' | 'pending' | 'filled' | 'cancelled' | 'rejected' | 'expired';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  filledAt?: string;
  filledPrice?: number;
  filledQuantity?: number;
  commission?: number;
  notes?: string;
}

export interface Position {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  createdAt: string;
  updatedAt: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  commission: number;
  netPnL: number;
  entryTime: string;
  exitTime: string;
  duration: number; // in minutes
  strategy?: string;
  notes?: string;
}

export interface Portfolio {
  totalEquity: number;
  availableBalance: number;
  usedMargin: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  positions: Position[];
  trades: Trade[];
  performance: {
    totalReturn: number;
    dailyReturn: number;
    weeklyReturn: number;
    monthlyReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    profitFactor: number;
  };
}

export interface Strategy {
  id: string;
  name: string;
  type: string;
  symbol: string;
  timeframe: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
  parameters: Record<string, any>;
  performance: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BacktestResult {
  id: string;
  strategyId: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  totalReturn: number;
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
  trades: Trade[];
  equityCurve: Array<{
    timestamp: string;
    equity: number;
    drawdown: number;
  }>;
  createdAt: string;
}

export interface RiskMetrics {
  currentDrawdown: number;
  maxDrawdown: number;
  var95: number; // Value at Risk 95%
  var99: number; // Value at Risk 99%
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  recoveryFactor: number;
}










