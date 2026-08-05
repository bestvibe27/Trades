import { useCallback, useEffect, useRef, useState } from 'react';
import { marketAPI } from '../services/marketAPI';
import { tradingAPI } from '../services/tradingAPI';
import { useKrakenWebSocket, KrakenOhlcTick, KrakenConnectionStatus } from './useKrakenWebSocket';

export interface ChartCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp: string;
}

export interface ChartQuote {
  last: number;
  bid: number;
  ask: number;
}

export interface UseChartDataOptions {
  limit?: number;
  pollMs?: number;
}

export type ChartDataSource = 'broker' | 'market' | 'kraken' | 'none';

/** Map UI timeframe labels to broker/market API strings. */
export function timeframeToApi(label: string): string {
  const map: Record<string, string> = {
    '1m': '1m',
    '3m': '3m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1H': '1h',
    '2H': '2h',
    '4H': '4h',
    '6H': '6h',
    '12H': '12h',
    '1D': '1d',
    '1W': '1w',
    '1M': '1M',
  };
  return map[label] ?? label.toLowerCase();
}

/** Minutes represented by a UI timeframe label (for onTimeframeChange). */
export function minutesFromTimeframeLabel(label: string): number {
  const map: Record<string, number> = {
    '1m': 1,
    '3m': 3,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1H': 60,
    '2H': 120,
    '4H': 240,
    '6H': 360,
    '12H': 720,
    '1D': 1440,
    '1W': 10080,
    '1M': 43200,
  };
  return map[label] ?? 1;
}

function normalizeCandles(raw: Array<{ open?: unknown; high?: unknown; low?: unknown; close?: unknown; volume?: unknown; timestamp?: unknown }>): ChartCandle[] {
  return raw
    .map((c) => ({
      open: Number(c.open ?? 0),
      high: Number(c.high ?? 0),
      low: Number(c.low ?? 0),
      close: Number(c.close ?? 0),
      volume: c.volume != null ? Number(c.volume) : undefined,
      timestamp: String(c.timestamp ?? ''),
    }))
    .filter((c) => c.timestamp && Number.isFinite(c.close))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

async function fetchCandlesFromSources(
  symbol: string,
  apiTf: string,
  limit: number,
  before?: string
): Promise<{ candles: ChartCandle[]; source: ChartDataSource }> {
  try {
    const res = await tradingAPI.getBrokerCandles(symbol, apiTf, limit, before);
    const candles = normalizeCandles(res.candles);
    if (candles.length) return { candles, source: 'broker' };
  } catch {
    // fall through to market API
  }

  try {
    const res = await marketAPI.getCandles(symbol, apiTf, undefined, undefined, limit, before);
    const candles = normalizeCandles(res.candles);
    if (candles.length) return { candles, source: (res.source as ChartDataSource) || 'market' };
  } catch {
    // both failed
  }

  return { candles: [], source: 'none' };
}

export function useChartData(
  symbol: string,
  initialTimeframe: string,
  options: UseChartDataOptions = {}
) {
  const { limit = 200, pollMs = 30000 } = options;

  const [timeframe, setTimeframeState] = useState(initialTimeframe);
  const [candles, setCandles] = useState<ChartCandle[]>([]);
  const [quote, setQuote] = useState<ChartQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ChartDataSource>('none');

  const loadingHistoryRef = useRef(false);
  const candlesRef = useRef(candles);
  candlesRef.current = candles;

  const apiTf = timeframeToApi(timeframe);

  // Handle incoming live Kraken WebSocket tick
  const handleKrakenTick = useCallback((tick: KrakenOhlcTick) => {
    setQuote({
      last: tick.close,
      bid: tick.close,
      ask: tick.close,
    });

    setCandles((prev) => {
      if (!prev.length) {
        return [
          {
            open: tick.open,
            high: tick.high,
            low: tick.low,
            close: tick.close,
            volume: tick.volume,
            timestamp: tick.timestamp,
          },
        ];
      }

      const next = prev.slice();
      const lastIndex = next.length - 1;
      const lastCandle = { ...next[lastIndex] };

      const lastTs = new Date(lastCandle.timestamp).getTime();
      const tickTs = new Date(tick.timestamp).getTime();

      // If tick belongs to current forming candle (same interval timestamp or within 1 sec)
      if (Math.abs(tickTs - lastTs) < 2000 || tickTs === lastTs) {
        lastCandle.open = tick.open;
        lastCandle.high = Math.max(lastCandle.high, tick.high);
        lastCandle.low = Math.min(lastCandle.low, tick.low);
        lastCandle.close = tick.close;
        if (tick.volume != null) lastCandle.volume = tick.volume;
        next[lastIndex] = lastCandle;
        return next;
      } else if (tickTs > lastTs) {
        // New candle interval started!
        next.push({
          open: tick.open,
          high: tick.high,
          low: tick.low,
          close: tick.close,
          volume: tick.volume,
          timestamp: tick.timestamp,
        });
        // Limit max stored candles
        if (next.length > limit + 50) {
          return next.slice(next.length - limit);
        }
        return next;
      }

      return prev;
    });
  }, [limit]);

  // Connect live Kraken WebSocket
  const krakenWs = useKrakenWebSocket(symbol, timeframe, {
    enabled: !!symbol,
    onTick: handleKrakenTick,
  });

  const refresh = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    try {
      const { candles: fetched, source: src } = await fetchCandlesFromSources(symbol, apiTf, limit);
      setSource(src);
      if (!fetched.length) {
        setError('No candle data available for selected asset');
        setCandles([]);
      } else {
        setCandles(fetched);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol, apiTf, limit]);

  const loadMoreHistory = useCallback(async () => {
    if (!symbol || loadingHistoryRef.current) return;
    const oldest = candlesRef.current[0];
    if (!oldest?.timestamp) return;

    loadingHistoryRef.current = true;
    try {
      const { candles: older } = await fetchCandlesFromSources(
        symbol,
        apiTf,
        limit,
        oldest.timestamp
      );
      if (!older.length) return;

      const existingTs = new Set(candlesRef.current.map((c) => c.timestamp));
      const unique = older.filter((c) => !existingTs.has(c.timestamp));
      if (unique.length) {
        setCandles((prev) => [...unique, ...prev]);
      }
    } catch {
      // silent — chart will retry on next pan
    } finally {
      loadingHistoryRef.current = false;
    }
  }, [symbol, apiTf, limit]);

  const setTimeframe = useCallback((label: string) => {
    setTimeframeState(label);
  }, []);

  // Initial + symbol/timeframe change fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { candles: fetched, source: src } = await fetchCandlesFromSources(symbol, apiTf, limit);
        if (cancelled) return;
        setSource(src);
        if (!fetched.length) {
          setCandles([]);
          setError('No market data available for selected asset');
        } else {
          setCandles(fetched);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load market chart data');
          setCandles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, apiTf, limit]);

  // Sync external timeframe prop changes
  useEffect(() => {
    setTimeframeState(initialTimeframe);
  }, [initialTimeframe]);

  // Periodic historical candle sync fallback
  useEffect(() => {
    if (!symbol || pollMs <= 0) return;
    const id = setInterval(() => {
      fetchCandlesFromSources(symbol, apiTf, limit)
        .then(({ candles: fetched, source: src }) => {
          if (!fetched.length) return;
          setSource(src);
          setCandles((prev) => {
            if (!prev.length) return fetched;
            // Retain last tick close if fresh
            const merged = fetched.slice();
            const lastPrev = prev[prev.length - 1];
            const lastFetched = merged[merged.length - 1];
            if (lastPrev && lastFetched && new Date(lastPrev.timestamp).getTime() >= new Date(lastFetched.timestamp).getTime()) {
              merged[merged.length - 1] = {
                ...lastFetched,
                close: lastPrev.close,
                high: Math.max(lastFetched.high, lastPrev.high),
                low: Math.min(lastFetched.low, lastPrev.low),
              };
            }
            return merged;
          });
        })
        .catch(() => {});
    }, pollMs);
    return () => clearInterval(id);
  }, [symbol, apiTf, limit, pollMs]);

  return {
    candles,
    quote,
    loading,
    error,
    timeframe,
    setTimeframe,
    loadMoreHistory,
    refresh,
    source,
    wsStatus: krakenWs.status,
    rawPayload: krakenWs.rawPayload,
  };
}

export default useChartData;
