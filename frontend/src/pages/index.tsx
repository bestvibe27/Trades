import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    // also fetch broker account balances
    tradingAPI.getBrokerAccount().then(setAccount).catch(()=>{});
    return () => controller.abort();
  }, []);

  // Poll account every 10s
  usePolling(() => tradingAPI.getBrokerAccount().then(setAccount).catch(()=>{}), 10000, false);

  return (
    <Layout title="Dashboard - Trading Platform">
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Your trading overview</p>
        </div>
        <div className={styles.actions}>
          <Link href="/trading" className={`${styles.btn} ${styles.btnPrimary}`}>New Order</Link>
          <Link href="/strategies" className={styles.btn}>Strategies</Link>
        </div>
      </div>

      {/* Top stats */}
      <section className={styles.gridStats}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Account Balance</div>
          <div className={styles.cardValue}>${(account?.balance ?? 0).toFixed(2)}</div>
          <div className={styles.cardDelta}>Equity: ${(account?.equity ?? 0).toFixed(2)}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Open P/L</div>
          {(() => { const pnl = (account?.equity ?? 0) - (account?.balance ?? 0); const up = pnl >= 0; return (
            <>
              <div className={styles.cardValue + ' ' + (up ? 'pl' : 'nl')}>{up ? '+' : ''}${pnl.toFixed(2)}</div>
              <div className={styles.cardDelta}>Equity − Balance</div>
            </>
          ); })()}
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Free Margin</div>
          <div className={styles.cardValue}>${(account?.free_margin ?? 0).toFixed(2)}</div>
          <div className={styles.cardDelta}>Balance available to trade</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Win Rate</div>
          <div className={styles.cardValue}>58%</div>
          <div className={styles.progress}><span style={{width:'58%'}}/></div>
        </div>
      </section>

      {/* Market Overview */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Market Overview</h2>
          <div className={styles.sectionActions}>
            <Link href="/market" className={styles.btn}>Open Market</Link>
          </div>
        </div>
        <div className={styles.gridCards}>
          {['EURUSD','BTCUSDT','ETHUSDT','XAUUSD'].map((sym)=> (
            <div key={sym} className={styles.miniTicker}>
              <div className={styles.miniTickerHead}>
                <span>{sym}</span>
                <span className="pl">+0.84%</span>
              </div>
              <div className={styles.miniTickerPrice}>1,234.56</div>
              <div className={styles.sparkline}>
                <div className={styles.sparkbar} style={{height:'40%'}}/>
                <div className={styles.sparkbar} style={{height:'60%'}}/>
                <div className={styles.sparkbar} style={{height:'30%'}}/>
                <div className={styles.sparkbar} style={{height:'70%'}}/>
                <div className={styles.sparkbar} style={{height:'50%'}}/>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.columns}>
        {/* Open Positions */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}><h2>Open Positions</h2></div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Entry</th>
                  <th>Last</th>
                  <th>P/L</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {s:'EURUSD', q:1.2, e:1.0732, l:1.0784, pl:'+61.2', up:true},
                  {s:'BTCUSDT', q:0.1, e:64000, l:63920, pl:'-8.0', up:false},
                ].map((r)=> (
                  <tr key={r.s}>
                    <td>{r.s}</td>
                    <td>{r.q}</td>
                    <td>{r.e}</td>
                    <td>{r.l}</td>
                    <td className={r.up ? 'pl' : 'nl'}>{r.up ? '+' : ''}{r.pl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Trade History */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}><h2>Trade History</h2></div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {t:'12:01', s:'EURUSD', side:'Buy', q:1.0, p:1.0766},
                  {t:'12:15', s:'BTCUSDT', side:'Sell', q:0.05, p:64210},
                ].map((r,i)=> (
                  <tr key={i}>
                    <td>{r.t}</td>
                    <td>{r.s}</td>
                    <td className={r.side === 'Buy' ? 'pl' : 'nl'}>{r.side}</td>
                    <td>{r.q}</td>
                    <td>{r.p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Backend health small card */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}><h2>System</h2></div>
        <div className={styles.card}>
          {status === 'loading' ? 'Checking...' : message}
        </div>
      </section>
    </Layout>
  );
}


