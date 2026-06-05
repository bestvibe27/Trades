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
          <h1 className="text-2xl font-bold text-gray-900">Strategy Backtesting</h1>
          <p className="mt-1 text-sm text-gray-600">
            Test your trading strategies against historical data
          </p>
        </div>

        {/* Backtest form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Run Backtest</h3>
          <form onSubmit={handleRunBacktest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Strategy</label>
                <select
                  value={formData.strategy}
                  onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="sma_crossover">SMA Crossover</option>
                  <option value="rsi_mean_reversion">RSI Mean Reversion</option>
                  <option value="custom">Custom Strategy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Symbol</label>
                <select
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EURUSD">EUR/USD</option>
                  <option value="GBPUSD">GBP/USD</option>
                  <option value="BTCUSDT">BTC/USDT</option>
                  <option value="ETHUSDT">ETH/USDT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Timeframe</label>
                <select
                  value={formData.timeframe}
                  onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                <input
                  type="number"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: Number(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  min="1000"
                  step="1000"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md text-sm font-medium"
              >
                {isRunning ? 'Running Backtest...' : 'Run Backtest'}
              </button>
            </div>
          </form>
        </div>

        {/* Backtest results */}
        {results.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Backtest Results
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Historical performance of your strategies
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Strategy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Return
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Drawdown
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sharpe Ratio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trades
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.strategyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.startDate} to {result.endDate}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {result.maxDrawdown.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.sharpeRatio.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.winRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.totalTrades}
                      </td>
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
            <div className="text-gray-500">No backtest results yet</div>
            <p className="mt-2 text-sm text-gray-400">
              Run your first backtest to see strategy performance
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BacktestPage;










