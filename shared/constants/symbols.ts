/**
 * Trading symbols and instrument definitions
 */

export const SYMBOL_CATEGORIES = {
  FOREX: 'forex',
  CRYPTO: 'crypto',
  STOCKS: 'stocks',
  COMMODITIES: 'commodities',
  INDICES: 'indices'
} as const;

export type SymbolCategory = typeof SYMBOL_CATEGORIES[keyof typeof SYMBOL_CATEGORIES];

export interface TradingSymbol {
  symbol: string;
  name: string;
  category: SymbolCategory;
  baseCurrency: string;
  quoteCurrency: string;
  minLotSize: number;
  maxLotSize: number;
  lotStep: number;
  tickSize: number;
  tickValue: number;
  spread: number;
  enabled: boolean;
}

export const FOREX_SYMBOLS: TradingSymbol[] = [
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0001,
    enabled: true
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'GBP',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0002,
    enabled: true
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'USD',
    quoteCurrency: 'JPY',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.001,
    tickValue: 1,
    spread: 0.02,
    enabled: true
  }
];

export const CRYPTO_SYMBOLS: TradingSymbol[] = [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin / Tether',
    category: SYMBOL_CATEGORIES.CRYPTO,
    baseCurrency: 'BTC',
    quoteCurrency: 'USDT',
    minLotSize: 0.001,
    maxLotSize: 10,
    lotStep: 0.001,
    tickSize: 0.01,
    tickValue: 1,
    spread: 1,
    enabled: true
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum / Tether',
    category: SYMBOL_CATEGORIES.CRYPTO,
    baseCurrency: 'ETH',
    quoteCurrency: 'USDT',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.5,
    enabled: true
  }
];

export const ALL_SYMBOLS: TradingSymbol[] = [
  ...FOREX_SYMBOLS,
  ...CRYPTO_SYMBOLS
];

export const getSymbolByCode = (symbol: string): TradingSymbol | undefined => {
  return ALL_SYMBOLS.find(s => s.symbol === symbol);
};

export const getEnabledSymbols = (): TradingSymbol[] => {
  return ALL_SYMBOLS.filter(s => s.enabled);
};










