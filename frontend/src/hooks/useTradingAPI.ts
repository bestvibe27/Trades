import { useState, useCallback } from 'react';
import { get, post } from '../services/api';

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: string;
  createdAt: string;
}

interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
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

interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
}

export const useTradingAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = useCallback(async (orderRequest: OrderRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await post<{ order_id: string; status: string }>('/trading/order', orderRequest);
      return { success: true, data: response };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to place order';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPositions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await get<{ positions: Position[] }>('/portfolio/positions');
      return { success: true, data: response.positions };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch positions';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await get<{ trades: Trade[] }>('/portfolio/trades');
      return { success: true, data: response.trades };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch trades';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await get<{ orders: Order[] }>('/trading/orders');
      return { success: true, data: response.orders };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch orders';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (orderId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await post(`/trading/orders/${orderId}/cancel`, {});
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to cancel order';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    placeOrder,
    getPositions,
    getTrades,
    getOrders,
    cancelOrder,
    clearError,
  };
};










