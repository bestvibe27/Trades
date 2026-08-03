import { useCallback, useEffect, useRef, useState } from 'react';
import { marketAPI } from '../services/marketAPI';
import { tradingAPI } from '../services/tradingAPI';

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

export type ChartDataSource = 'broker' | 'market' | 'none';

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

function mergeQuoteIntoLast(candles: ChartCandle[], quote: ChartQuote | null): ChartCandle[] {
  if (!candles.length || !quote || !Number.isFinite(quote.last)) return candles;
  const next = candles.slice();
  const last = { ...next[next.length - 1] };
  last.close = quote.last;
  last.high = Math.max(last.high, quote.last);
  last.low = Math.min(last.low, quote.last);
  next[next.length - 1] = last;
  return next;
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
    if (candles.length) return { candles, source: 'market' };
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
  const { limit = 200, pollMs = 15000 } = options;

  const [timeframe, setTimeframeState] = useState(initialTimeframe);
  const [candles, setCandles] = useState<ChartCandle[]>([]);
  const [quote, setQuote] = useState<ChartQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ChartDataSource>('none');

  const loadingHistoryRef = useRef(false);
  const candlesRef = useRef(candles);
  const quoteRef = useRef(quote);
  candlesRef.current = candles;
  quoteRef.current = quote;

  const apiTf = timeframeToApi(timeframe);

  const refresh = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    try {
      const { candles: fetched, source: src } = await fetchCandlesFromSources(symbol, apiTf, limit);
      setSource(src);
      if (!fetched.length) {
        setError('No candle data available');
        setCandles([]);
      } else {
        setCandles(mergeQuoteIntoLast(fetched, quoteRef.current));
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
          setError('No candle data available');
        } else {
          setCandles(mergeQuoteIntoLast(fetched, quoteRef.current));
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load chart data');
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

  // Poll candle refetch (keeps bars fresh beyond last-quote merge)
  useEffect(() => {
    if (!symbol || pollMs <= 0) return;
    const id = setInterval(() => {
      fetchCandlesFromSources(symbol, apiTf, limit)
        .then(({ candles: fetched, source: src }) => {
          if (!fetched.length) return;
          setSource(src);
          setCandles(mergeQuoteIntoLast(fetched, quoteRef.current));
        })
        .catch(() => {});
    }, pollMs);
    return () => clearInterval(id);
  }, [symbol, apiTf, limit, pollMs]);

  // Live quote: EventSource with reconnect + polling fallback
  useEffect(() => {
    if (!symbol || typeof window === 'undefined') return;

    let stopped = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let es: EventSource | null = null;
    let backoffMs = 1000;

    const applyQuote = (q: ChartQuote) => {
      if (stopped) return;
      setQuote(q);
      setCandles((prev) => mergeQuoteIntoLast(prev, q));
    };

    const pollQuote = async () => {
      try {
        const q = await tradingAPI.getBrokerQuote(symbol);
        applyQuote({ last: q.last, bid: q.bid, ask: q.ask });
      } catch {
        // ignore
      }
    };

    const startPollingFallback = () => {
      if (pollTimer || stopped) return;
      pollQuote();
      pollTimer = setInterval(pollQuote, 2000);
    };

    const stopPollingFallback = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const connect = () => {
      if (stopped) return;
      try {
        es?.close();
        es = new EventSource(tradingAPI.getBrokerStreamUrl(symbol, 1000));
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (data?.last != null) {
              backoffMs = 1000;
              stopPollingFallback();
              applyQuote({
                last: Number(data.last),
                bid: Number(data.bid ?? data.last),
                ask: Number(data.ask ?? data.last),
              });
            }
          } catch {
            // ignore malformed payloads
          }
        };
        es.onerror = () => {
          es?.close();
          es = null;
          startPollingFallback();
          if (stopped) return;
          const delay = backoffMs;
          backoffMs = Math.min(backoffMs * 2, 15000);
          reconnectTimer = setTimeout(connect, delay);
        };
      } catch {
        startPollingFallback();
        if (!stopped) {
          reconnectTimer = setTimeout(connect, backoffMs);
          backoffMs = Math.min(backoffMs * 2, 15000);
        }
      }
    };

    connect();

    return () => {
      stopped = true;
      es?.close();
      stopPollingFallback();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [symbol]);

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
  };
}

export default useChartData;
