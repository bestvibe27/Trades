/**
 * Application constants and configuration values
 */

// Trading symbols
export const TRADING_SYMBOLS = {
  FOREX: [
    'EURUSDm', 'GBPUSDm', 'USDJPYm', 'USDCHFm', 'USDCADm', 'AUDUSDm', 'NZDUSDm',
    'EURGBPm', 'EURJPYm', 'EURCHFm', 'GBPJPYm', 'GBPCHFm', 'AUDJPYm', 'CADJPYm',
    'CHFJPYm', 'NZDJPYm', 'EURNZDm', 'EURCADm', 'GBPCADm', 'AUDNZDm'
  ],
  COMMODITIES: [
    'XAUUSDm', 'XAGUSDm', 'XBRUSDm', 'XTIUSDm', 'XNGUSDm', 'XPDUSDm', 'XPTUSDm'
  ],
  INDICES: [
    'US30m', 'US500m', 'USTECm', 'GER40m', 'UK100m', 'FRA40m', 'JPN225m', 'HK50m', 'AUS200m'
  ],
  CRYPTO: [
    'BTCUSDm', 'ETHUSDm', 'LTCUSDm', 'XRPUSDm', 'BCHUSDm', 'ADAUSDm', 'DOGEUSDm', 'SOLUSDm'
  ],
  STOCKS: [
    'AAPLm', 'TSLAm', 'MSFTm', 'AMZNm', 'METAm', 'GOOGLm', 'NVDAm', 'NFLXm', 'JPMm', 'BRK.Bm'
  ],
} as const;

// Timeframes
export const TIMEFRAMES = {
  M1: '1m',
  M5: '5m',
  M15: '15m',
  M30: '30m',
  H1: '1h',
  H4: '4h',
  D1: '1d',
  W1: '1w',
  MN1: '1M',
} as const;

// Order types
export const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP: 'stop',
  STOP_LIMIT: 'stop_limit',
} as const;

// Order sides
export const ORDER_SIDES = {
  BUY: 'buy',
  SELL: 'sell',
} as const;

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  PARTIALLY_FILLED: 'partially_filled',
} as const;

// Strategy types
export const STRATEGY_TYPES = {
  SMA_CROSSOVER: 'sma_crossover',
  RSI: 'rsi',
  BOLLINGER_BANDS: 'bollinger_bands',
  MACD: 'macd',
  CUSTOM: 'custom',
} as const;

// Risk levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  MARKET: {
    CANDLES: '/market/candles',
    QUOTES: '/market/quotes',
    OVERVIEW: '/market/overview',
  },
  TRADING: {
    ORDERS: '/trading/orders',
    ORDER: '/trading/order',
    POSITIONS: '/trading/positions',
  },
  PORTFOLIO: {
    SUMMARY: '/portfolio/summary',
    POSITIONS: '/portfolio/positions',
    TRADES: '/portfolio/trades',
    PERFORMANCE: '/portfolio/performance',
  },
  STRATEGIES: {
    LIST: '/strategies',
    CREATE: '/strategies',
    UPDATE: '/strategies',
    BACKTEST: '/strategies/backtest',
  },
} as const;

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  PRICE_UPDATE: 'price_update',
  ORDER_UPDATE: 'order_update',
  POSITION_UPDATE: 'position_update',
  TRADE_UPDATE: 'trade_update',
  ERROR: 'error',
  HEARTBEAT: 'heartbeat',
} as const;

// Chart colors
export const CHART_COLORS = {
  BULLISH: '#10b981', // Green
  BEARISH: '#ef4444', // Red
  NEUTRAL: '#6b7280', // Gray
  PRIMARY: '#2563eb', // Blue
  SECONDARY: '#4f46e5', // Indigo
  WARNING: '#f59e0b', // Yellow
  INFO: '#3b82f6', // Light Blue
} as const;

// Risk management constants
export const RISK_CONSTANTS = {
  MAX_POSITION_SIZE_PERCENT: 10, // Maximum 10% of account per position
  MAX_DAILY_LOSS_PERCENT: 5, // Maximum 5% daily loss
  MAX_DRAWDOWN_PERCENT: 20, // Maximum 20% drawdown
  DEFAULT_STOP_LOSS_PERCENT: 2, // Default 2% stop loss
  DEFAULT_TAKE_PROFIT_PERCENT: 4, // Default 4% take profit
  MIN_ACCOUNT_BALANCE: 100, // Minimum account balance
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  DASHBOARD_LAYOUT: 'dashboard_layout',
  CHART_SETTINGS: 'chart_settings',
} as const;

// Default values
export const DEFAULTS = {
  PAGE_SIZE: 20,
  REFRESH_INTERVAL: 5000, // 5 seconds
  CHART_HEIGHT: 400,
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // 300ms
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INSUFFICIENT_BALANCE: 'Insufficient account balance.',
  INVALID_SYMBOL: 'Invalid trading symbol.',
  INVALID_QUANTITY: 'Invalid quantity.',
  MARKET_CLOSED: 'Market is currently closed.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ORDER_PLACED: 'Order placed successfully.',
  ORDER_CANCELLED: 'Order cancelled successfully.',
  STRATEGY_CREATED: 'Strategy created successfully.',
  STRATEGY_UPDATED: 'Strategy updated successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
} as const;










