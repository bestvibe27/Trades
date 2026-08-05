import React, { useState, useEffect } from 'react';
import marketAPI, { Ticker } from '../../services/marketAPI';

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
  symbols = ['BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD'],
  refreshInterval = 10000 
}) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      const res = await marketAPI.getTickers(symbols).catch(() => null);
      if (res && res.tickers && res.tickers.length > 0) {
        const realData: MarketData[] = res.tickers.map((t: Ticker) => ({
          symbol: t.symbol,
          price: t.price,
          change: t.change,
          changePercent: t.changePercent,
          volume: t.volume,
          high24h: t.high24h,
          low24h: t.low24h,
        }));
        setMarketData(realData);
      } else {
        // Fetch individually if bulk endpoints fail
        const individual = await Promise.all(
          symbols.map((sym) => marketAPI.getTicker(sym).catch(() => null))
        );
        const valid = individual.filter((t): t is Ticker => t != null);
        if (valid.length > 0) {
          setMarketData(
            valid.map((t) => ({
              symbol: t.symbol,
              price: t.price,
              change: t.change,
              changePercent: t.changePercent,
              volume: t.volume,
              high24h: t.high24h,
              low24h: t.low24h,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error fetching market overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, refreshInterval);
    return () => clearInterval(interval);
  }, [symbols, refreshInterval]);

  const formatPrice = (price: number) => (price > 10 ? price.toFixed(2) : price.toFixed(4));
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
        {marketData.length === 0 ? (
          <div className="text-sm text-gray-500 py-2">No market data available</div>
        ) : (
          marketData.map((data) => (
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MarketOverview;
