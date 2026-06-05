import React, { useState } from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  commission: number;
  entryTime: string;
  exitTime: string;
  strategyId?: string;
  strategyName?: string;
}

interface TradeHistoryProps {
  trades: Trade[];
  onViewDetails: (tradeId: string) => void;
  loading?: boolean;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({
  trades,
  onViewDetails,
  loading = false
}) => {
  const [sortBy, setSortBy] = useState<'exitTime' | 'pnl' | 'symbol'>('exitTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterSymbol, setFilterSymbol] = useState<string>('');
  const [filterSide, setFilterSide] = useState<string>('');

  const getSideColor = (side: string) => {
    return side === 'buy' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPnLBackgroundColor = (pnl: number) => {
    return pnl >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const filteredAndSortedTrades = trades
    .filter(trade => {
      if (filterSymbol && trade.symbol !== filterSymbol) return false;
      if (filterSide && trade.side !== filterSide) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'exitTime':
          aValue = new Date(a.exitTime).getTime();
          bValue = new Date(b.exitTime).getTime();
          break;
        case 'pnl':
          aValue = a.pnl;
          bValue = b.pnl;
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const uniqueSymbols = Array.from(new Set(trades.map(trade => trade.symbol))).sort();

  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const totalCommission = trades.reduce((sum, trade) => sum + trade.commission, 0);
  const winningTrades = trades.filter(trade => trade.pnl > 0).length;
  const losingTrades = trades.filter(trade => trade.pnl < 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No trade history</div>
          <p className="text-sm text-gray-400">
            Your completed trades will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Trade History</h3>
        <p className="mt-1 text-sm text-gray-500">
          Complete history of your trading activity
        </p>
      </div>

      {/* Filters and Summary */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="input text-sm"
            >
              <option value="">All Symbols</option>
              {uniqueSymbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>

            <select
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value)}
              className="input text-sm"
            >
              <option value="">All Sides</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="input text-sm"
            >
              <option value="exitTime-desc">Newest First</option>
              <option value="exitTime-asc">Oldest First</option>
              <option value="pnl-desc">Highest P&L</option>
              <option value="pnl-asc">Lowest P&L</option>
              <option value="symbol-asc">Symbol A-Z</option>
            </select>
          </div>

          {/* Summary Stats */}
          <div className="flex space-x-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{trades.length}</div>
              <div className="text-gray-500">Total Trades</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${getPnLColor(totalPnL)}`}>
                {formatCurrency(totalPnL)}
              </div>
              <div className="text-gray-500">Total P&L</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {winRate.toFixed(1)}%
              </div>
              <div className="text-gray-500">Win Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Side
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entry Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exit Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                P&L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exit Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Strategy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedTrades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {trade.symbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSideColor(trade.side)}`}>
                    {trade.side.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trade.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(trade.entryPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(trade.exitPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPnLBackgroundColor(trade.pnl)}`}>
                    <span className={getPnLColor(trade.pnl)}>
                      {formatCurrency(trade.pnl)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(trade.commission)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(trade.exitTime, { includeTime: true })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trade.strategyName || 'Manual'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onViewDetails(trade.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination or Load More */}
      {filteredAndSortedTrades.length > 50 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {filteredAndSortedTrades.length} of {trades.length} trades
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Load More
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;










