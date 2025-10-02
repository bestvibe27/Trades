import React, { useState, useEffect } from 'react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
}

interface MarketOverviewProps {
  symbols?: string[];
  refreshInterval?: number;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ 
  symbols = ['EURUSD', 'GBPUSD', 'BTCUSDT', 'ETHUSDT'],
  refreshInterval = 5000 
}) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      // Mock data - replace with real API call
      const mockData: MarketData[] = symbols.map(symbol => ({
        symbol,
        price: Math.random() * 100 + 1,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.random() * 1000000,
        high24h: Math.random() * 100 + 1,
        low24h: Math.random() * 100 + 1,
      }));

      setMarketData(mockData);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, refreshInterval);
    return () => clearInterval(interval);
  }, [symbols, refreshInterval]);

  const formatPrice = (price: number) => price.toFixed(4);
  const formatVolume = (volume: number) => volume.toLocaleString();
  const formatChange = (change: number) => (change >= 0 ? '+' : '') + change.toFixed(2);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Market Overview</h3>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Market Overview</h3>
        <button
          onClick={fetchMarketData}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-3">
        {marketData.map((data) => (
          <div key={data.symbol} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{data.symbol}</div>
              <div className="text-sm text-gray-500">
                Vol: {formatVolume(data.volume)}
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium text-gray-900">
                {formatPrice(data.price)}
              </div>
              <div className={`text-sm ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatChange(data.change)} ({formatChange(data.changePercent)}%)
              </div>
            </div>
            
            <div className="text-right ml-4 text-sm text-gray-500">
              <div>H: {formatPrice(data.high24h)}</div>
              <div>L: {formatPrice(data.low24h)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketOverview;










