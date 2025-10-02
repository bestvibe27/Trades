import React from 'react';
import { formatCurrency, formatPercentage, formatDateTime } from '../../utils/formatters';

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
    lastUpdate: string;
  };
  createdAt: string;
  lastRun?: string;
}

interface StrategyListProps {
  strategies: Strategy[];
  onEdit: (strategy: Strategy) => void;
  onToggle: (strategyId: string, action: 'start' | 'pause' | 'stop') => void;
  onDelete: (strategyId: string) => void;
  onViewDetails: (strategyId: string) => void;
  loading?: boolean;
}

const StrategyList: React.FC<StrategyListProps> = ({
  strategies,
  onEdit,
  onToggle,
  onDelete,
  onViewDetails,
  loading = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'stopped':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'paused':
        return '🟡';
      case 'stopped':
        return '⚫';
      case 'error':
        return '🔴';
      default:
        return '❓';
    }
  };

  const getStrategyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'sma_crossover': 'SMA Crossover',
      'rsi_mean_reversion': 'RSI Mean Reversion',
      'bollinger_bands': 'Bollinger Bands',
      'macd': 'MACD',
      'custom': 'Custom Strategy'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No strategies found</div>
          <p className="text-sm text-gray-400">
            Create your first trading strategy to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Trading Strategies</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage and monitor your automated trading strategies
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-medium text-gray-900">
                    {strategy.name}
                  </h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(strategy.status)}`}>
                    <span className="mr-1">{getStatusIcon(strategy.status)}</span>
                    {strategy.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                  <span className="font-medium">{getStrategyTypeLabel(strategy.type)}</span> • 
                  <span className="ml-1">{strategy.symbol}</span> • 
                  <span className="ml-1">{strategy.timeframe}</span>
                  {strategy.lastRun && (
                    <span className="ml-2">
                      • Last run: {formatDateTime(strategy.lastRun, { includeTime: true })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {strategy.performance.totalTrades}
                    </div>
                    <div className="text-xs text-gray-500">Total Trades</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPercentage(strategy.performance.winRate)}
                    </div>
                    <div className="text-xs text-gray-500">Win Rate</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${strategy.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(strategy.performance.totalPnL)}
                    </div>
                    <div className="text-xs text-gray-500">Total P&L</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatPercentage(strategy.performance.maxDrawdown)}
                    </div>
                    <div className="text-xs text-gray-500">Max Drawdown</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {strategy.performance.sharpeRatio.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Sharpe Ratio</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {strategy.performance.profitFactor.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Profit Factor</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    Winning: <span className="font-medium text-green-600">{strategy.performance.winningTrades}</span>
                  </span>
                  <span>
                    Losing: <span className="font-medium text-red-600">{strategy.performance.losingTrades}</span>
                  </span>
                  <span>
                    Last Update: {formatDateTime(strategy.performance.lastUpdate, { includeTime: true })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-6">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewDetails(strategy.id)}
                    className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onEdit(strategy)}
                    className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  {strategy.status === 'active' ? (
                    <button
                      onClick={() => onToggle(strategy.id, 'pause')}
                      className="px-3 py-1 text-xs font-medium text-yellow-600 hover:text-yellow-800 border border-yellow-300 rounded hover:bg-yellow-50 transition-colors"
                    >
                      Pause
                    </button>
                  ) : strategy.status === 'paused' ? (
                    <button
                      onClick={() => onToggle(strategy.id, 'start')}
                      className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-800 border border-green-300 rounded hover:bg-green-50 transition-colors"
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggle(strategy.id, 'start')}
                      className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-800 border border-green-300 rounded hover:bg-green-50 transition-colors"
                    >
                      Start
                    </button>
                  )}
                  
                  <button
                    onClick={() => onToggle(strategy.id, 'stop')}
                    className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
                  >
                    Stop
                  </button>
                  
                  <button
                    onClick={() => onDelete(strategy.id)}
                    className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {strategy.status === 'error' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <span className="text-red-400 mr-2">⚠️</span>
                  <span className="text-sm text-red-800">
                    Strategy encountered an error. Check logs for details.
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-400">
              Created: {formatDateTime(strategy.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategyList;










