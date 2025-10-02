import { useState, useEffect, useCallback } from 'react';
import { get } from '../services/api';

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

interface MarketDataState {
  candles: Candle[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export const useMarketData = (symbol: string, timeframe: string, limit: number = 100) => {
  const [state, setState] = useState<MarketDataState>({
    candles: [],
    isLoading: false,
    error: null,
    lastUpdate: null,
  });

  const fetchCandles = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await get<{ candles: Candle[] }>(`/market/candles/${symbol}/${timeframe}?limit=${limit}`);
      setState({
        candles: response.candles,
        isLoading: false,
        error: null,
        lastUpdate: new Date(),
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch market data',
      }));
    }
  }, [symbol, timeframe, limit]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchCandles, 30000);
    return () => clearInterval(interval);
  }, [fetchCandles]);

  const refresh = useCallback(() => {
    fetchCandles();
  }, [fetchCandles]);

  return {
    ...state,
    refresh,
  };
};

// Hook for real-time price updates
export const usePriceUpdates = (symbol: string) => {
  const [price, setPrice] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Mock WebSocket connection - replace with real WebSocket
    const mockPrice = 1.0950 + (Math.random() - 0.5) * 0.01;
    setPrice(mockPrice);
    setIsConnected(true);

    const interval = setInterval(() => {
      const newPrice = 1.0950 + (Math.random() - 0.5) * 0.01;
      setPrice(newPrice);
    }, 1000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [symbol]);

  return { price, isConnected };
};










