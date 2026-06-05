import { create } from 'zustand';

interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  entryTime: string;
  exitTime: string;
}

interface PortfolioMetrics {
  totalEquity: number;
  availableBalance: number;
  usedMargin: number;
  totalPnL: number;
  totalPnLPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
}

interface PortfolioState {
  positions: Position[];
  trades: Trade[];
  metrics: PortfolioMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface PortfolioActions {
  setPositions: (positions: Position[]) => void;
  setTrades: (trades: Trade[]) => void;
  setMetrics: (metrics: PortfolioMetrics) => void;
  addTrade: (trade: Trade) => void;
  updatePosition: (symbol: string, updates: Partial<Position>) => void;
  removePosition: (symbol: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdate: (date: Date) => void;
  clearError: () => void;
}

type PortfolioStore = PortfolioState & PortfolioActions;

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  // State
  positions: [],
  trades: [],
  metrics: null,
  isLoading: false,
  error: null,
  lastUpdate: null,

  // Actions
  setPositions: (positions) => set((state) => ({
    positions,
    lastUpdate: new Date(),
  })),

  setTrades: (trades) => set((state) => ({
    trades,
    lastUpdate: new Date(),
  })),

  setMetrics: (metrics) => set((state) => ({
    metrics,
    lastUpdate: new Date(),
  })),

  addTrade: (trade) => set((state) => ({
    trades: [...state.trades, trade],
    lastUpdate: new Date(),
  })),

  updatePosition: (symbol, updates) => set((state) => ({
    positions: state.positions.map(pos => 
      pos.symbol === symbol ? { ...pos, ...updates } : pos
    ),
    lastUpdate: new Date(),
  })),

  removePosition: (symbol) => set((state) => ({
    positions: state.positions.filter(pos => pos.symbol !== symbol),
    lastUpdate: new Date(),
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastUpdate: (lastUpdate) => set({ lastUpdate }),
  clearError: () => set({ error: null }),
}));










