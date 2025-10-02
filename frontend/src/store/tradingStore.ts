import { create } from 'zustand';

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface TradingState {
  orders: Order[];
  activeOrders: Order[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface TradingActions {
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;
  setActiveOrders: (orders: Order[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdate: (date: Date) => void;
  clearError: () => void;
}

type TradingStore = TradingState & TradingActions;

export const useTradingStore = create<TradingStore>((set, get) => ({
  // State
  orders: [],
  activeOrders: [],
  isLoading: false,
  error: null,
  lastUpdate: null,

  // Actions
  setOrders: (orders) => set((state) => ({
    orders,
    lastUpdate: new Date(),
  })),

  addOrder: (order) => set((state) => ({
    orders: [...state.orders, order],
    activeOrders: order.status === 'pending' ? [...state.activeOrders, order] : state.activeOrders,
    lastUpdate: new Date(),
  })),

  updateOrder: (orderId, updates) => set((state) => {
    const updatedOrders = state.orders.map(order => 
      order.id === orderId ? { ...order, ...updates, updatedAt: new Date().toISOString() } : order
    );
    
    const updatedActiveOrders = state.activeOrders.filter(order => 
      order.id !== orderId || updates.status !== 'pending'
    );

    return {
      orders: updatedOrders,
      activeOrders: updatedActiveOrders,
      lastUpdate: new Date(),
    };
  }),

  removeOrder: (orderId) => set((state) => ({
    orders: state.orders.filter(order => order.id !== orderId),
    activeOrders: state.activeOrders.filter(order => order.id !== orderId),
    lastUpdate: new Date(),
  })),

  setActiveOrders: (activeOrders) => set((state) => ({
    activeOrders,
    lastUpdate: new Date(),
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastUpdate: (lastUpdate) => set({ lastUpdate }),
  clearError: () => set({ error: null }),
}));










