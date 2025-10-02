import { create } from 'zustand';

interface Candle {
  symbol: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: string;
}

interface MarketState {
  candles: Record<string, Candle[]>;
  prices: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface MarketActions {
  setCandles: (symbol: string, candles: Candle[]) => void;
  updatePrice: (symbol: string, price: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdate: (date: Date) => void;
  clearError: () => void;
}

type MarketStore = MarketState & MarketActions;

export const useMarketStore = create<MarketStore>((set, get) => ({
  // State
  candles: {},
  prices: {},
  isLoading: false,
  error: null,
  lastUpdate: null,

  // Actions
  setCandles: (symbol, candles) => set((state) => ({
    candles: {
      ...state.candles,
      [symbol]: candles,
    },
    lastUpdate: new Date(),
  })),

  updatePrice: (symbol, price) => set((state) => ({
    prices: {
      ...state.prices,
      [symbol]: price,
    },
    lastUpdate: new Date(),
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastUpdate: (lastUpdate) => set({ lastUpdate }),
  clearError: () => set({ error: null }),
}));










