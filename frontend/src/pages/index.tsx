import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ScaleIcon,
  TrophyIcon,
  PlusIcon,
  ChartBarSquareIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/common/Layout';
import styles from '../styles/Dashboard.module.css';
import tradingAPI from '../services/tradingAPI';
import { usePolling } from '../hooks/usePolling';

export default function HomePage() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [account, setAccount] = useState<{ balance: number; equity: number; free_margin: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
    fetch(`${apiBase}/healthz`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setMessage(JSON.stringify(data));
        setStatus('ok');
      })
      .catch((err) => {
        setMessage(String(err));
        setStatus('error');
      });
    tradingAPI.getBrokerAccount().then(setAccount).catch(() => {});
    return () => controller.abort();
  }, []);

  usePolling(() => tradingAPI.getBrokerAccount().then(setAccount).catch(() => {}), 10000, false);

  const pnl = (account?.equity ?? 0) - (account?.balance ?? 0);
  const pnlUp = pnl >= 0;

  return (
    <Layout title="Dashboard - TradeDesk">
      <div className="fade-in">
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Your trading overview at a glance</p>
          </div>
          <div className={styles.actions}>
            <Link href="/trading" className="btn btn-primary">
              <PlusIcon width={18} height={18} />
              New Order
            </Link>
            <Link href="/strategies" className="btn">
              <ChartBarSquareIcon width={18} height={18} />
              Strategies
            </Link>
          </div>
        </div>

        {/* Top stats */}
        <section className={styles.gridStats}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.cardLabel}>Account Balance</span>
              <span className={styles.statIcon}><BanknotesIcon /></span>
            </div>
            <div className={styles.cardValue}>${(account?.balance ?? 0).toFixed(2)}</div>
            <div className={styles.cardDelta}>Equity: ${(account?.equity ?? 0).toFixed(2)}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.cardLabel}>Open P/L</span>
              <span className={`${styles.statIcon} ${pnlUp ? styles.statIconGreen : styles.statIconRed}`}>
                <ArrowTrendingUpIcon />
              </span>
            </div>
            <div className={`${styles.cardValue} ${pnlUp ? 'pl' : 'nl'}`}>
              {pnlUp ? '+' : ''}${pnl.toFixed(2)}
            </div>
            <div className={styles.cardDelta}>Equity − Balance</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.cardLabel}>Free Margin</span>
              <span className={styles.statIcon}><ScaleIcon /></span>
            </div>
            <div className={styles.cardValue}>${(account?.free_margin ?? 0).toFixed(2)}</div>
            <div className={styles.cardDelta}>Balance available to trade</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.cardLabel}>Win Rate</span>
              <span className={`${styles.statIcon} ${styles.statIconGreen}`}><TrophyIcon /></span>
            </div>
            <div className={styles.cardValue}>58%</div>
            <div className={styles.progress}><span style={{ width: '58%' }} /></div>
          </div>
        </section>

        {/* Market Overview */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Market Overview</h2>
            <Link href="/market" className="btn">Open Market</Link>
          </div>
          <div className={styles.gridCards}>
            {[
              { sym: 'EURUSD', price: '1,234.56', change: '+0.84%', up: true },
              { sym: 'BTCUSDT', price: '64,320', change: '-1.20%', up: false },
              { sym: 'ETHUSDT', price: '3,195', change: '+2.10%', up: true },
              { sym: 'XAUUSD', price: '2,034.10', change: '+0.32%', up: true },
            ].map((t) => (
              <div key={t.sym} className={styles.miniTicker}>
                <div className={styles.miniTickerHead}>
                  <span className={styles.miniTickerSym}>{t.sym}</span>
                  <span className={t.up ? 'pl' : 'nl'}>{t.change}</span>
                </div>
                <div className={styles.miniTickerPrice}>{t.price}</div>
                <div className={styles.sparkline} aria-hidden="true">
                  {[40, 60, 30, 70, 50].map((h, i) => (
                    <div key={i} className={styles.sparkbar} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className={`${styles.columns} ${styles.section}`}>
          {/* Open Positions */}
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Open Positions</h2>
              <Link href="/trading" className="btn">View all</Link>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Symbol</th><th>Qty</th><th>Entry</th><th>Last</th><th>P/L</th></tr>
                </thead>
                <tbody>
                  {[
                    { s: 'EURUSD', q: 1.2, e: 1.0732, l: 1.0784, pl: '61.2', up: true },
                    { s: 'BTCUSDT', q: 0.1, e: 64000, l: 63920, pl: '8.0', up: false },
                  ].map((r) => (
                    <tr key={r.s}>
                      <td className={styles.sym}>{r.s}</td>
                      <td>{r.q}</td>
                      <td>{r.e}</td>
                      <td>{r.l}</td>
                      <td className={r.up ? 'pl' : 'nl'}>{r.up ? '+' : '−'}{r.pl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Trade History */}
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Trade History</h2>
              <Link href="/portfolio" className="btn">View all</Link>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Time</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Price</th></tr>
                </thead>
                <tbody>
                  {[
                    { t: '12:01', s: 'EURUSD', side: 'Buy', q: 1.0, p: 1.0766 },
                    { t: '12:15', s: 'BTCUSDT', side: 'Sell', q: 0.05, p: 64210 },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td>{r.t}</td>
                      <td className={styles.sym}>{r.s}</td>
                      <td className={r.side === 'Buy' ? styles.sideBuy : styles.sideSell}>{r.side}</td>
                      <td>{r.q}</td>
                      <td>{r.p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* System status */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}><h2>System</h2></div>
          <div className={styles.panel}>
            <div className={styles.statusBar}>
              <span
                className={`${styles.statusBadge} ${
                  status === 'ok' ? styles.statusOk : status === 'error' ? styles.statusErr : styles.statusLoading
                }`}
              >
                <span className={styles.statusDot} />
                {status === 'loading' ? 'Checking…' : status === 'ok' ? 'Operational' : 'Error'}
              </span>
              <span className={styles.statusMsg}>{status === 'loading' ? 'Pinging backend…' : message}</span>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
