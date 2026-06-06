import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { get } from '../services/api';
import tradingAPI from '../services/tradingAPI';
import { usePolling } from '../hooks/usePolling';
import styles from '../styles/Portfolio.module.css';

interface PortfolioData {
  totalEquity: number;
  availableBalance: number;
  usedMargin: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  performance: {
    totalReturn: number;
    dailyReturn: number;
    weeklyReturn: number;
    monthlyReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    profitFactor: number;
  };
}

interface DealRow {
  id: number | string;
  symbol: string;
  side: 'buy'|'sell'|'other';
  volume: number;
  price: number;
  profit: number;
  time: string; // ISO
}

interface PositionRow {
  symbol: string;
  side: 'buy'|'sell'|'other';
  volume: number;
  price_open: number;
  price_current: number;
  tp: number;
  sl: number;
  ticket: number | null;
  time: string | null; // ISO
  swap: number;
  profit: number;
}

const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<DealRow[]>([]);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Poll live account values and positions
  usePolling(() => fetchPortfolio(), 10000, false);
  usePolling(async () => {
    try {
      const res = await tradingAPI.getBrokerPositions();
      const list: PositionRow[] = (res.positions || []).slice();
      // newest first
      list.sort((a, b) => {
        const at = a.time ? new Date(a.time).getTime() : 0;
        const bt = b.time ? new Date(b.time).getTime() : 0;
        return bt - at;
      });
      setPositions(list);
      // also update unrealized from latest positions
      setPortfolio(prev => prev ? { ...prev, unrealizedPnL: list.reduce((s, p) => s + (p.profit || 0), 0), totalPnL: (prev.realizedPnL || 0) + list.reduce((s, p) => s + (p.profit || 0), 0) } : prev);
    } catch {}
  }, 5000, false);

  // Poll recent trades
  usePolling(async () => {
    try {
      const res = await tradingAPI.getBrokerTrades(50);
      const list: DealRow[] = (res.trades || []).map((d: any) => ({
        id: d.id,
        symbol: d.symbol,
        side: d.side,
        volume: d.volume,
        price: d.price,
        profit: d.profit ?? 0,
        time: d.time,
      }));
      list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setTrades(list);
    } catch {}
  }, 10000, false);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      // Fetch live account values + open positions from MT5
      const [acc, posRes] = await Promise.all([
        tradingAPI.getBrokerAccount(),
        tradingAPI.getBrokerPositions()
      ]);
      const equity = acc.equity ?? 0;
      const balance = acc.balance ?? 0;
      const free = acc.free_margin ?? 0;
      const used = Math.max(0, balance - free);
      const posList: PositionRow[] = (posRes.positions || []).slice();
      posList.sort((a, b) => {
        const at = a.time ? new Date(a.time).getTime() : 0;
        const bt = b.time ? new Date(b.time).getTime() : 0;
        return bt - at;
      });
      setPositions(posList);
      const unreal = posList.reduce((sum, p) => sum + (p.profit || 0), 0);
      // initial trades load
      try {
        const res = await tradingAPI.getBrokerTrades(50);
        const list: DealRow[] = (res.trades || []).map((d: any) => ({
          id: d.id,
          symbol: d.symbol,
          side: d.side,
          volume: d.volume,
          price: d.price,
          profit: d.profit ?? 0,
          time: d.time,
        }));
        list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setTrades(list);
      } catch {}

      const portfolioData: PortfolioData = {
        totalEquity: equity,
        availableBalance: free,
        usedMargin: used,
        unrealizedPnL: unreal,
        realizedPnL: 0,
        totalPnL: unreal,
        performance: {
          totalReturn: 0,
          dailyReturn: 0,
          weeklyReturn: 0,
          monthlyReturn: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          winRate: 0,
          profitFactor: 0
        }
      };

      setPortfolio(portfolioData);
    } catch (err) {
      setError('Failed to fetch portfolio data');
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Portfolio - TradeDesk">
        <div className={styles.page}>
          <div className={styles.cards}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`skeleton ${styles.skel}`} />
            ))}
          </div>
          <div className={`skeleton`} style={{ height: 220 }} />
        </div>
      </Layout>
    );
  }

  if (error || !portfolio) {
    return (
      <Layout title="Portfolio - TradeDesk">
        <div className={styles.page}>
          <div className={styles.empty}>{error || 'Failed to load portfolio'}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Portfolio - TradeDesk">
      <div className={`${styles.page} fade-in`}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Portfolio</h1>
            <p className={styles.subtitle}>Overview of your account and performance</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Total Equity</div>
            <div className={styles.cardValue}>${portfolio.totalEquity.toLocaleString()}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Available Balance</div>
            <div className={styles.cardValue}>${portfolio.availableBalance.toLocaleString()}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Used Margin</div>
            <div className={styles.cardValue}>${portfolio.usedMargin.toLocaleString()}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Total P&L</div>
            <div className={`${styles.cardValue} ${portfolio.totalPnL >= 0 ? 'pl' : 'nl'}`}>${portfolio.totalPnL.toLocaleString()}</div>
          </div>
        </div>

        {/* Performance metrics */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}><h2>Performance Metrics</h2></div>
          <div className={styles.metricsGrid}>
            {[
              { label: 'Total Return', value: `${portfolio.performance.totalReturn >= 0 ? '+' : ''}${portfolio.performance.totalReturn.toFixed(2)}%`, cls: portfolio.performance.totalReturn >= 0 ? 'pl' : 'nl' },
              { label: 'Daily Return', value: `${portfolio.performance.dailyReturn >= 0 ? '+' : ''}${portfolio.performance.dailyReturn.toFixed(2)}%`, cls: portfolio.performance.dailyReturn >= 0 ? 'pl' : 'nl' },
              { label: 'Weekly Return', value: `${portfolio.performance.weeklyReturn >= 0 ? '+' : ''}${portfolio.performance.weeklyReturn.toFixed(2)}%`, cls: portfolio.performance.weeklyReturn >= 0 ? 'pl' : 'nl' },
              { label: 'Monthly Return', value: `${portfolio.performance.monthlyReturn >= 0 ? '+' : ''}${portfolio.performance.monthlyReturn.toFixed(2)}%`, cls: portfolio.performance.monthlyReturn >= 0 ? 'pl' : 'nl' },
              { label: 'Max Drawdown', value: `${portfolio.performance.maxDrawdown.toFixed(2)}%`, cls: 'nl' },
              { label: 'Sharpe Ratio', value: portfolio.performance.sharpeRatio.toFixed(2), cls: '' },
              { label: 'Win Rate', value: `${portfolio.performance.winRate.toFixed(1)}%`, cls: '' },
              { label: 'Profit Factor', value: portfolio.performance.profitFactor.toFixed(2), cls: '' },
            ].map((m) => (
              <div key={m.label} className={styles.metric}>
                <div className={styles.metricLabel}>{m.label}</div>
                <div className={`${styles.metricValue} ${m.cls}`}>{m.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Open Positions (live from MT5) */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}><h2>Open Positions</h2></div>
          {positions.length === 0 ? (
            <div className={styles.empty}>No open positions</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Volume (Lot)</th>
                    <th>Open Price</th>
                    <th>Current Price</th>
                    <th>T/P</th>
                    <th>S/L</th>
                    <th>Position ID</th>
                    <th>Open Time</th>
                    <th>Swap (USD)</th>
                    <th>P/L (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p, idx) => (
                    <tr key={p.ticket ?? idx}>
                      <td>{p.symbol}</td>
                      <td className={p.side === 'buy' ? 'pl' : 'nl'}>{p.side?.toUpperCase()}</td>
                      <td>{p.volume.toFixed(2)}</td>
                      <td>{p.price_open.toFixed(5)}</td>
                      <td>{p.price_current.toFixed(5)}</td>
                      <td>{p.tp ? p.tp.toFixed(5) : '-'}</td>
                      <td>{p.sl ? p.sl.toFixed(5) : '-'}</td>
                      <td>{p.ticket ?? '-'}</td>
                      <td>{p.time ? new Date(p.time).toLocaleString() : '-'}</td>
                      <td>{p.swap?.toFixed(2)}</td>
                      <td className={p.profit >= 0 ? 'pl' : 'nl'}>{p.profit >= 0 ? '+' : ''}{p.profit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* P&L cards */}
        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Unrealized P&L</div>
            <div className={`${styles.cardValue} ${portfolio.unrealizedPnL >= 0 ? 'pl' : 'nl'}`}>${portfolio.unrealizedPnL.toFixed(2)}</div>
            <div className={styles.cardDelta}>Current open positions profit/loss</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Realized P&L</div>
            <div className={`${styles.cardValue} ${portfolio.realizedPnL >= 0 ? 'pl' : 'nl'}`}>${portfolio.realizedPnL.toFixed(2)}</div>
            <div className={styles.cardDelta}>Closed positions profit/loss</div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioPage;










