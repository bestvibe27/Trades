import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/common/Layout';
import TradingChart from '../components/charts/TradingChart';
import styles from '../styles/Market.module.css';
import marketAPI from '../services/marketAPI';

type TF = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const tfToSec: Record<TF, number> = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400 };

function generateMockCandles(count: number, tf: TF, startPrice = 100): any[] {
  const step = tfToSec[tf];
  const now = Math.floor(Date.now() / 1000);
  const bars: any[] = [];
  let prevClose = startPrice;
  for (let i = count - 1; i >= 0; i--) {
    const t = now - i * step;
    const drift = (Math.sin(i / 7) + Math.cos(i / 11)) * 0.2; // slight trend
    const change = (Math.random() - 0.5) * 0.8 + drift; // random + drift
    const open = prevClose;
    const close = Math.max(0.0001, open + change);
    const high = Math.max(open, close) + Math.random() * 0.6;
    const low = Math.min(open, close) - Math.random() * 0.6;
    bars.push({ time: t, open: round4(open), high: round4(high), low: round4(low), close: round4(close) });
    prevClose = close;
  }
  return bars;
}

function round4(n: number) { return Math.round(n * 10000) / 10000; }

export default function MarketPage() {
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState<TF>('15m');
  const [loading, setLoading] = useState(false);
  const [candles, setCandles] = useState<any[]>(generateMockCandles(200, '15m', 1.075));
  const [error, setError] = useState<string | null>(null);

  const timeframes: TF[] = useMemo(() => ['1m','5m','15m','1h','4h','1d'], []);
  const symbols = useMemo(() => ['EURUSD','GBPUSD','BTCUSDT','ETHUSDT','XAUUSD'], []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to fetch real candles; fall back to defaults if it fails
        const res = await marketAPI.getCandles(symbol, timeframe, undefined, undefined, 100).catch(() => null);
        if (!active) return;
        if (res && res.candles?.length) {
          const mapped = res.candles.map((c) => ({
            time: Math.floor(new Date(c.timestamp).getTime()/1000),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));
          setCandles(mapped);
        } else {
          setCandles(generateMockCandles(200, timeframe, 1.075));
        }
      } catch (e: any) {
        setError('Failed to load candles');
        setCandles(generateMockCandles(200, timeframe, 1.075));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [symbol, timeframe]);

  return (
    <Layout title={`Market - ${symbol} (${timeframe})`}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Market</h1>
          <p className={styles.subtitle}>Charts and real-time quotes</p>
        </div>
        <div className={styles.controls}>
          <select className={styles.input} value={symbol} onChange={(e)=> setSymbol(e.target.value)}>
            {symbols.map((s)=> (<option key={s} value={s}>{s}</option>))}
          </select>
          <div className={styles.tfGroup}>
            {timeframes.map((tf)=> (
              <button key={tf} onClick={()=> setTimeframe(tf)} className={`${styles.tf} ${tf===timeframe?styles.tfActive:''}`}>{tf}</button>
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
          <div className={styles.chartWrap}>
            <TradingChart data={candles as any} symbol={symbol} height={460} />
          </div>
          {loading && <div className={styles.overlay}>Loading...</div>}
          {error && <div className={styles.overlayError}>{error}</div>}
        </div>
      </section>

      <section className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Market Stats</div>
          <div className={styles.row}><span className={styles.muted}>Volatility</span><span>—</span></div>
          <div className={styles.row}><span className={styles.muted}>Avg Volume</span><span>—</span></div>
          <div className={styles.row}><span className={styles.muted}>24h Range</span><span>—</span></div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Recent Trades</div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Time</th><th>Side</th><th>Qty</th><th>Price</th></tr>
              </thead>
              <tbody>
                <tr><td>12:34:11</td><td className="pl">Buy</td><td>0.10</td><td>1.0784</td></tr>
                <tr><td>12:33:25</td><td className="nl">Sell</td><td>0.05</td><td>1.0779</td></tr>
                <tr><td>12:33:10</td><td className="pl">Buy</td><td>0.20</td><td>1.0781</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
}

