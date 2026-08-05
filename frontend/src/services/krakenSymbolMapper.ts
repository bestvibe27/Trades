/**
 * Centralized Kraken Symbol Mapper
 * 
 * Maps application symbols (e.g. BTCUSD, ETHUSD, EURUSD) to Kraken's canonical
 * REST pair strings and WebSocket pair names (e.g. XBT/USD, ETH/USD).
 * Fetches canonical pairs dynamically from GET /0/public/AssetPairs with local fallback.
 */

export interface KrakenPairInfo {
  restPair: string;
  wsPair: string;
  altname: string;
  base: string;
  quote: string;
}

const STATIC_FALLBACK_MAP: Record<string, KrakenPairInfo> = {
  BTCUSD: { restPair: 'XXBTZUSD', wsPair: 'XBT/USD', altname: 'XBTUSD', base: 'XBT', quote: 'USD' },
  BTCUSDT: { restPair: 'XBTUSDT', wsPair: 'XBT/USDT', altname: 'XBTUSDT', base: 'XBT', quote: 'USDT' },
  XBTUSD: { restPair: 'XXBTZUSD', wsPair: 'XBT/USD', altname: 'XBTUSD', base: 'XBT', quote: 'USD' },
  ETHUSD: { restPair: 'XETHZUSD', wsPair: 'ETH/USD', altname: 'ETHUSD', base: 'ETH', quote: 'USD' },
  ETHUSDT: { restPair: 'ETHUSDT', wsPair: 'ETH/USDT', altname: 'ETHUSDT', base: 'ETH', quote: 'USDT' },
  EURUSD: { restPair: 'EURUSD', wsPair: 'EUR/USD', altname: 'EURUSD', base: 'EUR', quote: 'USD' },
  GBPUSD: { restPair: 'GBPUSD', wsPair: 'GBP/USD', altname: 'GBPUSD', base: 'GBP', quote: 'USD' },
  USDJPY: { restPair: 'USDJPY', wsPair: 'USD/JPY', altname: 'USDJPY', base: 'USD', quote: 'JPY' },
  XAUUSD: { restPair: 'XAUUSD', wsPair: 'XAU/USD', altname: 'XAUUSD', base: 'XAU', quote: 'USD' },
};

class KrakenSymbolMapper {
  private dynamicMap: Map<string, KrakenPairInfo> = new Map();
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Populate with static fallback initially
    Object.entries(STATIC_FALLBACK_MAP).forEach(([key, info]) => {
      this.dynamicMap.set(key.toUpperCase(), info);
    });
  }

  /**
   * Fetch dynamic asset pairs from Kraken API
   */
  async loadAssetPairs(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const resp = await fetch('https://api.kraken.com/0/public/AssetPairs');
        if (!resp.ok) return;
        const data = await resp.json();
        if (data.error?.length || !data.result) return;

        Object.entries<any>(data.result).forEach(([pairKey, info]) => {
          const altname = (info.altname || '').toUpperCase();
          const wsname = info.wsname || '';
          if (!wsname) return;

          const base = wsname.split('/')[0] || '';
          const quote = wsname.split('/')[1] || '';

          const pairInfo: KrakenPairInfo = {
            restPair: pairKey,
            wsPair: wsname,
            altname: altname,
            base,
            quote,
          };

          // Register under multiple keys for resilient lookup
          if (altname) this.dynamicMap.set(altname, pairInfo);
          const cleanWs = wsname.replace('/', '').toUpperCase();
          this.dynamicMap.set(cleanWs, pairInfo);
          if (altname.startsWith('X') && altname.length > 4) {
            // e.g. XXBTZUSD -> BTCUSD alias
            const alias = altname.replace(/^X/, '').replace(/ZUSD$/, 'USD');
            this.dynamicMap.set(alias, pairInfo);
          }
        });

        this.isLoaded = true;
      } catch (err) {
        console.warn('KrakenSymbolMapper: Could not load dynamic AssetPairs, using static fallback.', err);
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Map internal app symbol (e.g. BTCUSD, ETHUSD) to Kraken WebSocket pair string (e.g. XBT/USD, ETH/USD)
   */
  toWsPair(symbol: string): string {
    const clean = symbol.replace(/m$/, '').toUpperCase();
    const info = this.dynamicMap.get(clean);
    if (info?.wsPair) return info.wsPair;

    // Smart fallback formatting if not in map
    if (clean.includes('/')) return clean;
    if (clean.length === 6) {
      const base = clean.slice(0, 3) === 'BTC' ? 'XBT' : clean.slice(0, 3);
      const quote = clean.slice(3);
      return `${base}/${quote}`;
    }
    return clean;
  }

  /**
   * Map internal app symbol to Kraken REST pair query parameter (e.g. XXBTZUSD, XETHZUSD)
   */
  toRestPair(symbol: string): string {
    const clean = symbol.replace(/m$/, '').toUpperCase();
    const info = this.dynamicMap.get(clean);
    if (info?.restPair) return info.restPair;
    if (info?.altname) return info.altname;
    return clean;
  }

  /**
   * Check if a symbol is supported by Kraken
   */
  isSupported(symbol: string): boolean {
    const clean = symbol.replace(/m$/, '').toUpperCase();
    return this.dynamicMap.has(clean);
  }
}

export const krakenSymbolMapper = new KrakenSymbolMapper();
export default krakenSymbolMapper;
