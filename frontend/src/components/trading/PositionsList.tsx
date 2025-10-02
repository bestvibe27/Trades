import React from 'react';
import { formatCurrency, formatPercentage, formatDateTime } from '../../utils/formatters';

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  margin: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: string;
  updatedAt: string;
}

interface PositionsListProps {
  positions: Position[];
  onClosePosition: (positionId: string) => void;
  onUpdateStopLoss: (positionId: string, stopLoss: number) => void;
  onUpdateTakeProfit: (positionId: string, takeProfit: number) => void;
  loading?: boolean;
}

const PositionsList: React.FC<PositionsListProps> = ({
  positions,
  onClosePosition,
  onUpdateStopLoss,
  onUpdateTakeProfit,
  loading = false
}) => {
  const getSideColor = (side: string) => {
    return side === 'long' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPnLBackgroundColor = (pnl: number) => {
    return pnl >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No open positions</div>
          <p className="text-sm text-gray-400">
            Your open trading positions will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Open Positions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Current market positions and their performance
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {positions.map((position) => (
          <div key={position.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h4 className="text-lg font-medium text-gray-900">
                    {position.symbol}
                  </h4>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getSideColor(position.side)}`}>
                    {position.side.toUpperCase()}
                  </span>
                  {position.leverage && (
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {position.leverage}x
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {position.quantity}
                    </div>
                    <div className="text-xs text-gray-500">Quantity</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(position.entryPrice)}
                    </div>
                    <div className="text-xs text-gray-500">Entry Price</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(position.currentPrice)}
                    </div>
                    <div className="text-xs text-gray-500">Current Price</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getPnLColor(position.unrealizedPnL)}`}>
                      {formatCurrency(position.unrealizedPnL)}
                    </div>
                    <div className="text-xs text-gray-500">Unrealized P&L</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getPnLColor(position.unrealizedPnLPercent)}`}>
                      {formatPercentage(position.unrealizedPnLPercent)}
                    </div>
                    <div className="text-xs text-gray-500">P&L %</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(position.margin)}
                    </div>
                    <div className="text-xs text-gray-500">Margin</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Realized P&L:</span>
                    <span className={`ml-2 font-medium ${getPnLColor(position.realizedPnL)}`}>
                      {formatCurrency(position.realizedPnL)}
                    </span>
                  </div>
                  {position.stopLoss && (
                    <div>
                      <span className="text-gray-500">Stop Loss:</span>
                      <span className="ml-2 font-medium text-red-600">
                        {formatCurrency(position.stopLoss)}
                      </span>
                    </div>
                  )}
                  {position.takeProfit && (
                    <div>
                      <span className="text-gray-500">Take Profit:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatCurrency(position.takeProfit)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Opened: {formatDateTime(position.openedAt, { includeTime: true })} • 
                  Updated: {formatDateTime(position.updatedAt, { includeTime: true })}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-6">
                <button
                  onClick={() => onClosePosition(position.id)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                >
                  Close Position
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const newStopLoss = prompt('Enter new stop loss price:', position.stopLoss?.toString() || '');
                      if (newStopLoss && !isNaN(Number(newStopLoss))) {
                        onUpdateStopLoss(position.id, Number(newStopLoss));
                      }
                    }}
                    className="px-3 py-1 text-xs font-medium text-orange-600 hover:text-orange-800 border border-orange-300 rounded hover:bg-orange-50 transition-colors"
                  >
                    Update SL
                  </button>
                  
                  <button
                    onClick={() => {
                      const newTakeProfit = prompt('Enter new take profit price:', position.takeProfit?.toString() || '');
                      if (newTakeProfit && !isNaN(Number(newTakeProfit))) {
                        onUpdateTakeProfit(position.id, Number(newTakeProfit));
                      }
                    }}
                    className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-800 border border-green-300 rounded hover:bg-green-50 transition-colors"
                  >
                    Update TP
                  </button>
                </div>
              </div>
            </div>

            {/* Position Performance Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Position Performance</span>
                <span className={getPnLColor(position.unrealizedPnLPercent)}>
                  {formatPercentage(position.unrealizedPnLPercent)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    position.unrealizedPnL >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(position.unrealizedPnLPercent) * 10, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Positions Summary */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {positions.length}
            </div>
            <div className="text-gray-500">Total Positions</div>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-bold ${getPnLColor(positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0))}`}>
              {formatCurrency(positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0))}
            </div>
            <div className="text-gray-500">Total Unrealized P&L</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(positions.reduce((sum, pos) => sum + pos.margin, 0))}
            </div>
            <div className="text-gray-500">Total Margin Used</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {positions.filter(pos => pos.unrealizedPnL >= 0).length}/{positions.length}
            </div>
            <div className="text-gray-500">Winning Positions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionsList;










