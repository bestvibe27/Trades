import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/common/Layout';
import TradingChart from '../components/charts/TradingChart';
import styles from '../styles/Market.module.css';
import marketAPI from '../services/marketAPI';

type TF = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export default function MarketPage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState<TF>('15m');
  const [loading, setLoading] = useState(false);
  const [candles, setCandles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const timeframes: TF[] = useMemo(() => ['1m', '5m', '15m', '1h', '4h', '1d'], []);
  const symbols = useMemo(() => ['BTCUSD', 'BTCUSDT', 'ETHUSD', 'ETHUSDT', 'EURUSD', 'GBPUSD', 'XAUUSD'], []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await marketAPI.getCandles(symbol, timeframe, undefined, undefined, 200);
        if (!active) return;
        if (res && res.candles?.length) {
          const mapped = res.candles.map((c) => ({
            time: Math.floor(new Date(c.timestamp).getTime() / 1000),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));
          setCandles(mapped);
          setError(null);
        } else {
          setCandles([]);
          setError(`No market candle data available for ${symbol}`);
        }
      } catch (e: any) {
        if (!active) return;
        setError(e.message || 'Failed to load market data from provider');
        setCandles([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [symbol, timeframe]);

  return (
    <Layout title={`Market - ${symbol} (${timeframe})`}>
      <div className="fade-in" style={{ padding: 24 }}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Market</h1>
            <p className={styles.subtitle}>Charts and real-time market data</p>
          </div>
          <div className={styles.controls}>
            <select className={styles.input} value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {symbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className={styles.tfGroup}>
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`${styles.tf} ${tf === timeframe ? styles.tfActive : ''}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.pair}>{symbol}</div>
              <div className={styles.badges}>
                <span className={styles.badge}>O: {candles.at(-1)?.open ?? '-'}</span>
                <span className={styles.badge}>H: {candles.at(-1)?.high ?? '-'}</span>
                <span className={styles.badge}>L: {candles.at(-1)?.low ?? '-'}</span>
                <span className={styles.badge}>C: {candles.at(-1)?.close ?? '-'}</span>
              </div>
            </div>
            {loading && <div style={{ padding: 40, textAlign: 'center' }}>Loading live market candles...</div>}
            {!loading && error && (
              <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
                <p>{error}</p>
              </div>
            )}
            {!loading && !error && (
              <TradingChart symbol={symbol} data={candles} height={380} />
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
