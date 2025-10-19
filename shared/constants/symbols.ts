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
    symbol: 'EURUSDm',
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
    symbol: 'GBPUSDm',
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
    symbol: 'USDJPYm',
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
  },
  {
    symbol: 'USDCHFm',
    name: 'US Dollar / Swiss Franc',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'USD',
    quoteCurrency: 'CHF',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0002,
    enabled: true
  },
  {
    symbol: 'USDCADm',
    name: 'US Dollar / Canadian Dollar',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'USD',
    quoteCurrency: 'CAD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0002,
    enabled: true
  },
  {
    symbol: 'AUDUSDm',
    name: 'Australian Dollar / US Dollar',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'AUD',
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
    symbol: 'NZDUSDm',
    name: 'New Zealand Dollar / US Dollar',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'NZD',
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
    symbol: 'EURGBPm',
    name: 'Euro / British Pound',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'EUR',
    quoteCurrency: 'GBP',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0002,
    enabled: true
  },
  {
    symbol: 'EURJPYm',
    name: 'Euro / Japanese Yen',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'EUR',
    quoteCurrency: 'JPY',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.001,
    tickValue: 1,
    spread: 0.02,
    enabled: true
  },
  {
    symbol: 'EURCHFm',
    name: 'Euro / Swiss Franc',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'EUR',
    quoteCurrency: 'CHF',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0002,
    enabled: true
  },
  {
    symbol: 'GBPJPYm',
    name: 'British Pound / Japanese Yen',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'GBP',
    quoteCurrency: 'JPY',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.001,
    tickValue: 1,
    spread: 0.02,
    enabled: true
  },
  {
    symbol: 'GBPCHFm',
    name: 'British Pound / Swiss Franc',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'GBP',
    quoteCurrency: 'CHF',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0002,
    enabled: true
  },
  {
    symbol: 'AUDJPYm',
    name: 'Australian Dollar / Japanese Yen',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'AUD',
    quoteCurrency: 'JPY',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.001,
    tickValue: 1,
    spread: 0.02,
    enabled: true
  },
  {
    symbol: 'CADJPYm',
    name: 'Canadian Dollar / Japanese Yen',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'CAD',
    quoteCurrency: 'JPY',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.001,
    tickValue: 1,
    spread: 0.02,
    enabled: true
  },
  {
    symbol: 'CHFJPYm',
    name: 'Swiss Franc / Japanese Yen',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'CHF',
    quoteCurrency: 'JPY',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.001,
    tickValue: 1,
    spread: 0.02,
    enabled: true
  },
  {
    symbol: 'NZDJPYm',
    name: 'New Zealand Dollar / Japanese Yen',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'NZD',
    quoteCurrency: 'JPY',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.001,
    tickValue: 1,
    spread: 0.02,
    enabled: true
  },
  {
    symbol: 'EURNZDm',
    name: 'Euro / New Zealand Dollar',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'EUR',
    quoteCurrency: 'NZD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0002,
    enabled: true
  },
  {
    symbol: 'EURCADm',
    name: 'Euro / Canadian Dollar',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'EUR',
    quoteCurrency: 'CAD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0002,
    enabled: true
  },
  {
    symbol: 'GBPCADm',
    name: 'British Pound / Canadian Dollar',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'GBP',
    quoteCurrency: 'CAD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0002,
    enabled: true
  },
  {
    symbol: 'AUDNZDm',
    name: 'Australian Dollar / New Zealand Dollar',
    category: SYMBOL_CATEGORIES.FOREX,
    baseCurrency: 'AUD',
    quoteCurrency: 'NZD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.0002,
    enabled: true
  }
];

export const COMMODITIES_SYMBOLS: TradingSymbol[] = [
  {
    symbol: 'XAUUSDm',
    name: 'Gold / US Dollar',
    category: SYMBOL_CATEGORIES.COMMODITIES,
    baseCurrency: 'XAU',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.3,
    enabled: true
  },
  {
    symbol: 'XAGUSDm',
    name: 'Silver / US Dollar',
    category: SYMBOL_CATEGORIES.COMMODITIES,
    baseCurrency: 'XAG',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.001,
    tickValue: 1,
    spread: 0.05,
    enabled: true
  },
  {
    symbol: 'XBRUSDm',
    name: 'Brent Crude Oil / US Dollar',
    category: SYMBOL_CATEGORIES.COMMODITIES,
    baseCurrency: 'XBR',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.05,
    enabled: true
  },
  {
    symbol: 'XTIUSDm',
    name: 'WTI Crude Oil / US Dollar',
    category: SYMBOL_CATEGORIES.COMMODITIES,
    baseCurrency: 'XTI',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.05,
    enabled: true
  },
  {
    symbol: 'XNGUSDm',
    name: 'Natural Gas / US Dollar',
    category: SYMBOL_CATEGORIES.COMMODITIES,
    baseCurrency: 'XNG',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.001,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  },
  {
    symbol: 'XPDUSDm',
    name: 'Palladium / US Dollar',
    category: SYMBOL_CATEGORIES.COMMODITIES,
    baseCurrency: 'XPD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.5,
    enabled: true
  },
  {
    symbol: 'XPTUSDm',
    name: 'Platinum / US Dollar',
    category: SYMBOL_CATEGORIES.COMMODITIES,
    baseCurrency: 'XPT',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.5,
    enabled: true
  }
];

export const INDICES_SYMBOLS: TradingSymbol[] = [
  {
    symbol: 'US30m',
    name: 'Dow Jones Industrial Average',
    category: SYMBOL_CATEGORIES.INDICES,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.1,
    tickValue: 1,
    spread: 1.0,
    enabled: true
  },
  {
    symbol: 'US500m',
    name: 'S&P 500',
    category: SYMBOL_CATEGORIES.INDICES,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.1,
    tickValue: 1,
    spread: 0.5,
    enabled: true
  },
  {
    symbol: 'USTECm',
    name: 'NASDAQ 100',
    category: SYMBOL_CATEGORIES.INDICES,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.1,
    tickValue: 1,
    spread: 0.5,
    enabled: true
  },
  {
    symbol: 'GER40m',
    name: 'DAX 40',
    category: SYMBOL_CATEGORIES.INDICES,
    baseCurrency: 'EUR',
    quoteCurrency: 'EUR',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.1,
    tickValue: 1,
    spread: 0.5,
    enabled: true
  },
  {
    symbol: 'UK100m',
    name: 'FTSE 100',
    category: SYMBOL_CATEGORIES.INDICES,
    baseCurrency: 'GBP',
    quoteCurrency: 'GBP',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.1,
    tickValue: 1,
    spread: 0.5,
    enabled: true
  },
  {
    symbol: 'FRA40m',
    name: 'CAC 40',
    category: SYMBOL_CATEGORIES.INDICES,
    baseCurrency: 'EUR',
    quoteCurrency: 'EUR',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.1,
    tickValue: 1,
    spread: 0.5,
    enabled: true
  },
  {
    symbol: 'JPN225m',
    name: 'Nikkei 225',
    category: SYMBOL_CATEGORIES.INDICES,
    baseCurrency: 'JPY',
    quoteCurrency: 'JPY',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 1.0,
    tickValue: 1,
    spread: 5.0,
    enabled: true
  },
  {
    symbol: 'HK50m',
    name: 'Hang Seng 50',
    category: SYMBOL_CATEGORIES.INDICES,
    baseCurrency: 'HKD',
    quoteCurrency: 'HKD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 1.0,
    tickValue: 1,
    spread: 5.0,
    enabled: true
  },
  {
    symbol: 'AUS200m',
    name: 'ASX 200',
    category: SYMBOL_CATEGORIES.INDICES,
    baseCurrency: 'AUD',
    quoteCurrency: 'AUD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.1,
    tickValue: 1,
    spread: 0.5,
    enabled: true
  }
];

export const CRYPTO_SYMBOLS: TradingSymbol[] = [
  {
    symbol: 'BTCUSDm',
    name: 'Bitcoin / US Dollar',
    category: SYMBOL_CATEGORIES.CRYPTO,
    baseCurrency: 'BTC',
    quoteCurrency: 'USD',
    minLotSize: 0.001,
    maxLotSize: 10,
    lotStep: 0.001,
    tickSize: 0.01,
    tickValue: 1,
    spread: 1.0,
    enabled: true
  },
  {
    symbol: 'ETHUSDm',
    name: 'Ethereum / US Dollar',
    category: SYMBOL_CATEGORIES.CRYPTO,
    baseCurrency: 'ETH',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.5,
    enabled: true
  },
  {
    symbol: 'LTCUSDm',
    name: 'Litecoin / US Dollar',
    category: SYMBOL_CATEGORIES.CRYPTO,
    baseCurrency: 'LTC',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.1,
    enabled: true
  },
  {
    symbol: 'XRPUSDm',
    name: 'Ripple / US Dollar',
    category: SYMBOL_CATEGORIES.CRYPTO,
    baseCurrency: 'XRP',
    quoteCurrency: 'USD',
    minLotSize: 1.0,
    maxLotSize: 100000,
    lotStep: 1.0,
    tickSize: 0.0001,
    tickValue: 1,
    spread: 0.0001,
    enabled: true
  },
  {
    symbol: 'BCHUSDm',
    name: 'Bitcoin Cash / US Dollar',
    category: SYMBOL_CATEGORIES.CRYPTO,
    baseCurrency: 'BCH',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.1,
    enabled: true
  },
  {
    symbol: 'ADAUSDm',
    name: 'Cardano / US Dollar',
    category: SYMBOL_CATEGORIES.CRYPTO,
    baseCurrency: 'ADA',
    quoteCurrency: 'USD',
    minLotSize: 1.0,
    maxLotSize: 100000,
    lotStep: 1.0,
    tickSize: 0.0001,
    tickValue: 1,
    spread: 0.0001,
    enabled: true
  },
  {
    symbol: 'DOGEUSDm',
    name: 'Dogecoin / US Dollar',
    category: SYMBOL_CATEGORIES.CRYPTO,
    baseCurrency: 'DOGE',
    quoteCurrency: 'USD',
    minLotSize: 1.0,
    maxLotSize: 1000000,
    lotStep: 1.0,
    tickSize: 0.00001,
    tickValue: 1,
    spread: 0.00001,
    enabled: true
  },
  {
    symbol: 'SOLUSDm',
    name: 'Solana / US Dollar',
    category: SYMBOL_CATEGORIES.CRYPTO,
    baseCurrency: 'SOL',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.1,
    enabled: true
  }
];

export const STOCKS_SYMBOLS: TradingSymbol[] = [
  {
    symbol: 'AAPLm',
    name: 'Apple Inc.',
    category: SYMBOL_CATEGORIES.STOCKS,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  },
  {
    symbol: 'TSLAm',
    name: 'Tesla Inc.',
    category: SYMBOL_CATEGORIES.STOCKS,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  },
  {
    symbol: 'MSFTm',
    name: 'Microsoft Corporation',
    category: SYMBOL_CATEGORIES.STOCKS,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  },
  {
    symbol: 'AMZNm',
    name: 'Amazon.com Inc.',
    category: SYMBOL_CATEGORIES.STOCKS,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  },
  {
    symbol: 'METAm',
    name: 'Meta Platforms Inc.',
    category: SYMBOL_CATEGORIES.STOCKS,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  },
  {
    symbol: 'GOOGLm',
    name: 'Alphabet Inc.',
    category: SYMBOL_CATEGORIES.STOCKS,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  },
  {
    symbol: 'NVDAm',
    name: 'NVIDIA Corporation',
    category: SYMBOL_CATEGORIES.STOCKS,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  },
  {
    symbol: 'NFLXm',
    name: 'Netflix Inc.',
    category: SYMBOL_CATEGORIES.STOCKS,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  },
  {
    symbol: 'JPMm',
    name: 'JPMorgan Chase & Co.',
    category: SYMBOL_CATEGORIES.STOCKS,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  },
  {
    symbol: 'BRK.Bm',
    name: 'Berkshire Hathaway Inc.',
    category: SYMBOL_CATEGORIES.STOCKS,
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    minLotSize: 0.01,
    maxLotSize: 100,
    lotStep: 0.01,
    tickSize: 0.01,
    tickValue: 1,
    spread: 0.01,
    enabled: true
  }
];

export const ALL_SYMBOLS: TradingSymbol[] = [
  ...FOREX_SYMBOLS,
  ...COMMODITIES_SYMBOLS,
  ...INDICES_SYMBOLS,
  ...CRYPTO_SYMBOLS,
  ...STOCKS_SYMBOLS
];

export const getSymbolByCode = (symbol: string): TradingSymbol | undefined => {
  return ALL_SYMBOLS.find(s => s.symbol === symbol);
};

export const getEnabledSymbols = (): TradingSymbol[] => {
  return ALL_SYMBOLS.filter(s => s.enabled);
};










