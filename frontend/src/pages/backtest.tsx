import React, { useState } from 'react';
import Layout from '../components/common/Layout';

interface BacktestResult {
  id: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
}

const BacktestPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [formData, setFormData] = useState({
    strategy: 'sma_crossover',
    symbol: 'EURUSD',
    timeframe: '1h',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    initialBalance: 10000
  });

  const handleRunBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);

    // Simulate backtest running
    setTimeout(() => {
      const newResult: BacktestResult = {
        id: Date.now().toString(),
        strategyName: formData.strategy,
        symbol: formData.symbol,
        timeframe: formData.timeframe,
        startDate: formData.startDate,
        endDate: formData.endDate,
        initialBalance: formData.initialBalance,
        finalBalance: formData.initialBalance * (1 + (Math.random() - 0.3) * 0.5),
        totalReturn: (Math.random() - 0.3) * 50,
        maxDrawdown: -(Math.random() * 10),
        sharpeRatio: Math.random() * 2,
        winRate: Math.random() * 100,
        totalTrades: Math.floor(Math.random() * 100) + 10
      };

      setResults([newResult, ...results]);
      setIsRunning(false);
    }, 3000);
  };

  return (
    <Layout title="Backtest - Trading Dashboard">
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Strategy Backtesting</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
            Test your trading strategies against historical data
          </p>
        </div>

        {/* Backtest form */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text)' }}>Run Backtest</h3>
          <form onSubmit={handleRunBacktest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Strategy</label>
                <select
                  value={formData.strategy}
                  onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                  className="input"
                >
                  <option value="sma_crossover">SMA Crossover</option>
                  <option value="rsi_mean_reversion">RSI Mean Reversion</option>
                  <option value="custom">Custom Strategy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Symbol</label>
                <select
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="input"
                >
                  <option value="EURUSD">EUR/USD</option>
                  <option value="GBPUSD">GBP/USD</option>
                  <option value="BTCUSDT">BTC/USDT</option>
                  <option value="ETHUSDT">ETH/USDT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Timeframe</label>
                <select
                  value={formData.timeframe}
                  onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                  className="input"
                >
                  <option value="1m">1 Minute</option>
                  <option value="5m">5 Minutes</option>
                  <option value="15m">15 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="4h">4 Hours</option>
                  <option value="1d">1 Day</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Initial Balance</label>
                <input
                  type="number"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: Number(e.target.value) })}
                  className="input"
                  min="1000"
                  step="1000"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isRunning}
                className="btn-primary"
              >
                {isRunning ? 'Running Backtest...' : 'Run Backtest'}
              </button>
            </div>
          </form>
        </div>

        {/* Backtest results */}
        {results.length > 0 && (
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ padding: '20px 24px' }}>
              <h3 className="text-lg leading-6 font-medium" style={{ color: 'var(--text)' }}>
                Backtest Results
              </h3>
              <p className="mt-1 max-w-2xl text-sm" style={{ color: 'var(--text-dim)' }}>
                Historical performance of your strategies
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Strategy</th>
                    <th>Symbol</th>
                    <th>Period</th>
                    <th>Total Return</th>
                    <th>Max Drawdown</th>
                    <th>Sharpe Ratio</th>
                    <th>Win Rate</th>
                    <th>Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id}>
                      <td>{result.strategyName}</td>
                      <td>{result.symbol}</td>
                      <td>{result.startDate} to {result.endDate}</td>
                      <td className={result.totalReturn >= 0 ? 'pl' : 'nl'}>
                        {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                      </td>
                      <td style={{ color: 'var(--loss)' }}>
                        {result.maxDrawdown.toFixed(2)}%
                      </td>
                      <td>{result.sharpeRatio.toFixed(2)}</td>
                      <td>{result.winRate.toFixed(1)}%</td>
                      <td>{result.totalTrades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !isRunning && (
          <div className="text-center py-12">
            <div style={{ color: 'var(--text-dim)' }}>No backtest results yet</div>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Run your first backtest to see strategy performance
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BacktestPage;










