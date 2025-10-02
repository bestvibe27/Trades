import React from 'react';
import { formatCurrency, formatPercentage, formatDateTime } from '../../utils/formatters';

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
  totalReturnPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  status: 'completed' | 'running' | 'failed';
  createdAt: string;
  completedAt?: string;
}

interface BacktestResultsProps {
  results: BacktestResult[];
  onViewDetails: (resultId: string) => void;
  onDelete: (resultId: string) => void;
  loading?: boolean;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({
  results,
  onViewDetails,
  onDelete,
  loading = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'running':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No backtest results</div>
          <p className="text-sm text-gray-400">
            Run your first backtest to see strategy performance analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Backtest Results</h3>
        <p className="mt-1 text-sm text-gray-500">
          Historical performance analysis of your trading strategies
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {results.map((result) => (
          <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-medium text-gray-900">
                    {result.strategyName}
                  </h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                    <span className="mr-1">{getStatusIcon(result.status)}</span>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                  <span className="font-medium">{result.symbol}</span> • {result.timeframe} • 
                  {formatDateTime(result.startDate, { format: 'short' })} - {formatDateTime(result.endDate, { format: 'short' })}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(result.finalBalance)}
                    </div>
                    <div className="text-xs text-gray-500">Final Balance</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${result.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(result.totalReturnPercent)}
                    </div>
                    <div className="text-xs text-gray-500">Total Return</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.totalTrades}
                    </div>
                    <div className="text-xs text-gray-500">Total Trades</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPercentage(result.winRate)}
                    </div>
                    <div className="text-xs text-gray-500">Win Rate</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatPercentage(result.maxDrawdown)}
                    </div>
                    <div className="text-xs text-gray-500">Max Drawdown</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.sharpeRatio.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Sharpe Ratio</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Profit Factor:</span>
                    <span className="ml-2 font-medium">{result.profitFactor.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg Win:</span>
                    <span className="ml-2 font-medium text-green-600">{formatCurrency(result.avgWin)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg Loss:</span>
                    <span className="ml-2 font-medium text-red-600">{formatCurrency(result.avgLoss)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Largest Win:</span>
                    <span className="ml-2 font-medium text-green-600">{formatCurrency(result.largestWin)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-6">
                <button
                  onClick={() => onViewDetails(result.id)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => onDelete(result.id)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {result.status === 'running' && (
              <div className="mt-4">
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span>Backtest in progress...</span>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-400">
              Created: {formatDateTime(result.createdAt)}
              {result.completedAt && (
                <span className="ml-4">
                  Completed: {formatDateTime(result.completedAt)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BacktestResults;










