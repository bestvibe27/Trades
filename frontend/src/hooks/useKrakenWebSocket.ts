import { useEffect, useRef, useState, useCallback } from 'react';
import { krakenSymbolMapper } from '../services/krakenSymbolMapper';

export type KrakenConnectionStatus = 'live' | 'reconnecting' | 'stale' | 'offline';

export interface KrakenOhlcTick {
  symbol: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string; // ISO UTC string
  timeEpoch: number; // Unix timestamp in seconds
  etimeEpoch: number;
  raw: any;
}

export interface UseKrakenWebSocketOptions {
  enabled?: boolean;
  onTick?: (tick: KrakenOhlcTick) => void;
}

/**
 * Convert timeframe label to Kraken interval in minutes
 */
export function timeframeToKrakenMinutes(tf: string): number {
  const map: Record<string, number> = {
    '1m': 1,
    '3m': 3,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '1H': 60,
    '2h': 120,
    '2H': 120,
    '4h': 240,
    '4H': 240,
    '6h': 360,
    '6H': 360,
    '12h': 720,
    '12H': 720,
    '1d': 1440,
    '1D': 1440,
    '1w': 10080,
    '1W': 10080,
  };
  return map[tf] ?? map[tf.toLowerCase()] ?? 1;
}

export function useKrakenWebSocket(
  symbol: string,
  timeframe: string,
  options: UseKrakenWebSocketOptions = {}
) {
  const { enabled = true, onTick } = options;

  const [status, setStatus] = useState<KrakenConnectionStatus>('offline');
  const [lastTick, setLastTick] = useState<KrakenOhlcTick | null>(null);
  const [rawPayload, setRawPayload] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffMsRef = useRef<number>(1000);
  const activeSubRef = useRef<{ pair: string; interval: number } | null>(null);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const wsPair = krakenSymbolMapper.toWsPair(symbol);
  const interval = timeframeToKrakenMinutes(timeframe);

  const cleanupSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !symbol) {
      cleanupSocket();
      setStatus('offline');
      return;
    }

    let stopped = false;

    // Load symbol mapper asset pairs on start
    krakenSymbolMapper.loadAssetPairs().catch(() => {});

    const connect = () => {
      if (stopped) return;
      cleanupSocket();
      setStatus('reconnecting');
      setError(null);

      try {
        const ws = new WebSocket('wss://ws.kraken.com');
        wsRef.current = ws;

        ws.onopen = () => {
          if (stopped) return;
          setStatus('live');
          backoffMsRef.current = 1000;

          // Subscribe to OHLC channel
          const subPayload = {
            event: 'subscribe',
            pair: [wsPair],
            subscription: {
              name: 'ohlc',
              interval: interval,
            },
          };
          activeSubRef.current = { pair: wsPair, interval };
          ws.send(JSON.stringify(subPayload));
        };

        ws.onmessage = (event) => {
          if (stopped) return;
          try {
            const data = JSON.parse(event.data);
            setRawPayload(data);

            // Handle array data message [channelID, ohlcData, channelName, pair]
            if (Array.isArray(data) && data.length >= 4 && typeof data[2] === 'string' && data[2].startsWith('ohlc')) {
              const ohlcData = data[1];
              if (Array.isArray(ohlcData) && ohlcData.length >= 8) {
                const timeEpoch = Math.floor(parseFloat(ohlcData[0]));
                const etimeEpoch = Math.floor(parseFloat(ohlcData[1]));
                const open = parseFloat(ohlcData[2]);
                const high = parseFloat(ohlcData[3]);
                const low = parseFloat(ohlcData[4]);
                const close = parseFloat(ohlcData[5]);
                const volume = parseFloat(ohlcData[7]);

                const tick: KrakenOhlcTick = {
                  symbol,
                  timeframe,
                  open,
                  high,
                  low,
                  close,
                  volume,
                  timestamp: new Date(timeEpoch * 1000).toISOString(),
                  timeEpoch,
                  etimeEpoch,
                  raw: data,
                };

                setLastTick(tick);
                if (onTickRef.current) {
                  onTickRef.current(tick);
                }
              }
            } else if (data.event === 'subscriptionStatus' && data.status === 'error') {
              setError(`Subscription error: ${data.errorMessage || 'Failed to subscribe'}`);
            }
          } catch (e) {
            // ignore JSON parse errors for heartbeats
          }
        };

        ws.onerror = (err) => {
          if (stopped) return;
          console.warn('Kraken WebSocket error:', err);
          setError('WebSocket connection error');
          setStatus('stale');
        };

        ws.onclose = () => {
          if (stopped) return;
          setStatus('reconnecting');
          const delay = backoffMsRef.current;
          backoffMsRef.current = Math.min(backoffMsRef.current * 2, 30000);
          reconnectTimerRef.current = setTimeout(connect, delay);
        };

      } catch (err: any) {
        if (stopped) return;
        setError(err?.message || 'Failed to connect WebSocket');
        setStatus('stale');
        const delay = backoffMsRef.current;
        backoffMsRef.current = Math.min(backoffMsRef.current * 2, 30000);
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      stopped = true;
      cleanupSocket();
    };
  }, [symbol, timeframe, wsPair, interval, enabled, cleanupSocket]);

  return {
    status,
    lastTick,
    rawPayload,
    error,
    wsPair,
  };
}

export default useKrakenWebSocket;
