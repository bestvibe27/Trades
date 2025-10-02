import React from 'react';

interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

interface PortfolioProps {
  positions: Position[];
  totalEquity: number;
  totalPnL: number;
  totalPnLPercent: number;
}

const Portfolio: React.FC<PortfolioProps> = ({
  positions,
  totalEquity,
  totalPnL,
  totalPnLPercent
}) => {
  const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercent = (value: number) => (value >= 0 ? '+' : '') + value.toFixed(2) + '%';

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Summary</h3>
      
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalEquity)}
          </div>
          <div className="text-sm text-gray-500">Total Equity</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalPnL)}
          </div>
          <div className="text-sm text-gray-500">Total P&L</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${totalPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(totalPnLPercent)}
          </div>
          <div className="text-sm text-gray-500">Total Return</div>
        </div>
      </div>

      {/* Positions */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Open Positions</h4>
        {positions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No open positions
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((position) => (
              <div key={position.symbol} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{position.symbol}</div>
                  <div className="text-sm text-gray-500">
                    {position.quantity} @ {formatCurrency(position.entryPrice)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {formatCurrency(position.currentPrice)}
                  </div>
                  <div className="text-sm text-gray-500">Current Price</div>
                </div>
                
                <div className="text-right ml-4">
                  <div className={`font-medium ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(position.unrealizedPnL)}
                  </div>
                  <div className={`text-sm ${position.unrealizedPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(position.unrealizedPnLPercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;










