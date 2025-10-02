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

const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Poll live account values every 10s
  usePolling(() => fetchPortfolio(), 10000, false);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      // Fetch live account values from MT5 and map into portfolio view
      const acc = await tradingAPI.getBrokerAccount();
      const equity = acc.equity ?? 0;
      const balance = acc.balance ?? 0;
      const free = acc.free_margin ?? 0;
      const used = Math.max(0, balance - free);

      const portfolioData: PortfolioData = {
        totalEquity: equity,
        availableBalance: free,
        usedMargin: used,
        unrealizedPnL: 0,
        realizedPnL: 0,
        totalPnL: 0,
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
      <Layout title="Portfolio - Trading Dashboard">
        <div className={styles.page}>
          <div className={styles.card}>Loading portfolio data...</div>
        </div>
      </Layout>
    );
  }

  if (error || !portfolio) {
    return (
      <Layout title="Portfolio - Trading Dashboard">
        <div className={styles.page}>
          <div className={styles.card} style={{ borderColor: '#5f1a1a', background: 'rgba(213,0,0,0.08)' }}>{error || 'Failed to load portfolio'}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Portfolio - Trading Dashboard">
      <div className={styles.page}>
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

        {/* Performance table */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}><h2>Performance Metrics</h2></div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Total Return</td><td className={portfolio.performance.totalReturn >= 0 ? 'pl' : 'nl'}>{portfolio.performance.totalReturn >= 0 ? '+' : ''}{portfolio.performance.totalReturn.toFixed(2)}%</td></tr>
                <tr><td>Daily Return</td><td className={portfolio.performance.dailyReturn >= 0 ? 'pl' : 'nl'}>{portfolio.performance.dailyReturn >= 0 ? '+' : ''}{portfolio.performance.dailyReturn.toFixed(2)}%</td></tr>
                <tr><td>Weekly Return</td><td className={portfolio.performance.weeklyReturn >= 0 ? 'pl' : 'nl'}>{portfolio.performance.weeklyReturn >= 0 ? '+' : ''}{portfolio.performance.weeklyReturn.toFixed(2)}%</td></tr>
                <tr><td>Monthly Return</td><td className={portfolio.performance.monthlyReturn >= 0 ? 'pl' : 'nl'}>{portfolio.performance.monthlyReturn >= 0 ? '+' : ''}{portfolio.performance.monthlyReturn.toFixed(2)}%</td></tr>
                <tr><td>Max Drawdown</td><td className="nl">{portfolio.performance.maxDrawdown.toFixed(2)}%</td></tr>
                <tr><td>Sharpe Ratio</td><td>{portfolio.performance.sharpeRatio.toFixed(2)}</td></tr>
                <tr><td>Win Rate</td><td>{portfolio.performance.winRate.toFixed(1)}%</td></tr>
                <tr><td>Profit Factor</td><td>{portfolio.performance.profitFactor.toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>
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










