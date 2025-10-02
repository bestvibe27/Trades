import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { post } from '../services/api';
import styles from '../styles/Strategies.module.css';

interface Strategy {
  id: string;
  name: string;
  type: string;
  symbol: string;
  timeframe: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
  parameters: Record<string, any>;
  performance: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
  };
}

const StrategiesPage: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockStrategies: Strategy[] = [
        {
          id: '1',
          name: 'SMA Crossover EURUSD',
          type: 'sma_crossover',
          symbol: 'EURUSD',
          timeframe: '1h',
          status: 'active',
          parameters: { fast: 10, slow: 30 },
          performance: {
            totalTrades: 45,
            winningTrades: 28,
            losingTrades: 17,
            winRate: 62.2,
            totalPnL: 125.50,
            maxDrawdown: -2.1,
            sharpeRatio: 1.45,
            profitFactor: 1.32
          }
        },
        {
          id: '2',
          name: 'RSI Mean Reversion BTCUSDT',
          type: 'rsi_mean_reversion',
          symbol: 'BTCUSDT',
          timeframe: '4h',
          status: 'paused',
          parameters: { period: 14, oversold: 30, overbought: 70 },
          performance: {
            totalTrades: 23,
            winningTrades: 15,
            losingTrades: 8,
            winRate: 65.2,
            totalPnL: 89.75,
            maxDrawdown: -1.8,
            sharpeRatio: 1.28,
            profitFactor: 1.45
          }
        }
      ];
      
      setStrategies(mockStrategies);
    } catch (err) {
      setError('Failed to fetch strategies');
      console.error('Error fetching strategies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStrategy = async (strategyData: any) => {
    try {
      // Mock strategy creation
      const newStrategy: Strategy = {
        id: Date.now().toString(),
        name: `${strategyData.type} ${strategyData.symbol}`,
        type: strategyData.type,
        symbol: strategyData.symbol,
        timeframe: strategyData.timeframe,
        status: 'active',
        parameters: strategyData.parameters,
        performance: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPnL: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          profitFactor: 0
        }
      };
      
      setStrategies([...strategies, newStrategy]);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating strategy:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout title="Strategies - Trading Dashboard">
        <div className={styles.page}>
          <div className={styles.tableWrap}>Loading strategies...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Strategies - Trading Dashboard">
      <div className={styles.page}>
        {/* Page header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Trading Strategies</h1>
            <p className={styles.subtitle}>Manage and monitor automated strategies</p>
          </div>
          <button onClick={() => setShowCreateForm(true)} className={styles.btn}>Create Strategy</button>
        </div>

        {/* Create strategy form */}
        {showCreateForm && (
          <div className={styles.tableWrap} style={{ padding: 16 }}>
            <h3 className={styles.title} style={{ fontSize: 16, marginBottom: 8 }}>Create New Strategy</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleCreateStrategy({
                type: formData.get('type'),
                symbol: formData.get('symbol'),
                timeframe: formData.get('timeframe'),
                parameters: {}
              });
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label>Strategy Type</label>
                  <select name="type" className="input" required>
                    <option value="">Select type</option>
                    <option value="sma_crossover">SMA Crossover</option>
                    <option value="rsi_mean_reversion">RSI Mean Reversion</option>
                    <option value="custom">Custom Strategy</option>
                  </select>
                </div>
                <div>
                  <label>Symbol</label>
                  <select name="symbol" className="input" required>
                    <option value="">Select symbol</option>
                    <option value="EURUSD">EUR/USD</option>
                    <option value="GBPUSD">GBP/USD</option>
                    <option value="BTCUSDT">BTC/USDT</option>
                    <option value="ETHUSDT">ETH/USDT</option>
                  </select>
                </div>
                <div>
                  <label>Timeframe</label>
                  <select name="timeframe" className="input" required>
                    <option value="">Select timeframe</option>
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="1d">1 Day</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" onClick={() => setShowCreateForm(false)} className={styles.btn}>Cancel</button>
                <button type="submit" className={styles.btn}>Create Strategy</button>
              </div>
            </form>
          </div>
        )}
        {/* Strategies table */}
        <div className={styles.section}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Timeframe</th>
                  <th>Status</th>
                  <th>Trades</th>
                  <th>Win Rate</th>
                  <th>Total P&L</th>
                  <th>Sharpe</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.type}</td>
                    <td>{s.symbol}</td>
                    <td>{s.timeframe}</td>
                    <td>
                      <span className={`${styles.badge} ${s.status==='active'?styles.badgeActive:s.status==='paused'?styles.badgePaused:s.status==='stopped'?styles.badgeStopped:styles.badgeError}`}>{s.status.toUpperCase()}</span>
                    </td>
                    <td>{s.performance.totalTrades}</td>
                    <td>{s.performance.winRate.toFixed(1)}%</td>
                    <td className={s.performance.totalPnL >= 0 ? 'pl' : 'nl'}>${s.performance.totalPnL.toFixed(2)}</td>
                    <td>{s.performance.sharpeRatio.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StrategiesPage;










