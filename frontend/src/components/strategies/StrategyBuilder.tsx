import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

interface StrategyBuilderProps {
  onSubmit: (strategy: StrategyConfig) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface StrategyConfig {
  name: string;
  type: string;
  symbol: string;
  timeframe: string;
  parameters: Record<string, any>;
  riskSettings: {
    maxPositionSize: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    maxDailyLoss: number;
  };
  isActive: boolean;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [config, setConfig] = useState<StrategyConfig>({
    name: '',
    type: 'sma_crossover',
    symbol: 'EURUSD',
    timeframe: '1h',
    parameters: {},
    riskSettings: {
      maxPositionSize: 0.1,
      stopLossPercent: 2,
      takeProfitPercent: 4,
      maxDailyLoss: 5
    },
    isActive: true
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'parameters' | 'risk'>('basic');

  const strategyTypes = [
    { value: 'sma_crossover', label: 'SMA Crossover', description: 'Simple Moving Average crossover strategy' },
    { value: 'rsi_mean_reversion', label: 'RSI Mean Reversion', description: 'RSI-based mean reversion strategy' },
    { value: 'bollinger_bands', label: 'Bollinger Bands', description: 'Bollinger Bands breakout strategy' },
    { value: 'macd', label: 'MACD', description: 'MACD signal crossover strategy' },
    { value: 'custom', label: 'Custom Strategy', description: 'User-defined strategy' }
  ];

  const symbols = [
    { value: 'EURUSD', label: 'EUR/USD' },
    { value: 'GBPUSD', label: 'GBP/USD' },
    { value: 'USDJPY', label: 'USD/JPY' },
    { value: 'BTCUSDT', label: 'BTC/USDT' },
    { value: 'ETHUSDT', label: 'ETH/USDT' }
  ];

  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' }
  ];

  const getStrategyParameters = (type: string) => {
    switch (type) {
      case 'sma_crossover':
        return [
          { key: 'fast_period', label: 'Fast SMA Period', type: 'number', default: 10, min: 5, max: 50 },
          { key: 'slow_period', label: 'Slow SMA Period', type: 'number', default: 30, min: 10, max: 200 }
        ];
      case 'rsi_mean_reversion':
        return [
          { key: 'period', label: 'RSI Period', type: 'number', default: 14, min: 5, max: 50 },
          { key: 'oversold', label: 'Oversold Level', type: 'number', default: 30, min: 10, max: 40 },
          { key: 'overbought', label: 'Overbought Level', type: 'number', default: 70, min: 60, max: 90 }
        ];
      case 'bollinger_bands':
        return [
          { key: 'period', label: 'Period', type: 'number', default: 20, min: 10, max: 50 },
          { key: 'std_dev', label: 'Standard Deviation', type: 'number', default: 2, min: 1, max: 3, step: 0.1 }
        ];
      case 'macd':
        return [
          { key: 'fast_period', label: 'Fast EMA Period', type: 'number', default: 12, min: 5, max: 50 },
          { key: 'slow_period', label: 'Slow EMA Period', type: 'number', default: 26, min: 10, max: 100 },
          { key: 'signal_period', label: 'Signal Period', type: 'number', default: 9, min: 5, max: 20 }
        ];
      default:
        return [];
    }
  };

  const handleParameterChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  const tabs = [
    { id: 'basic', name: 'Basic Settings', icon: '⚙️' },
    { id: 'parameters', name: 'Strategy Parameters', icon: '📊' },
    { id: 'risk', name: 'Risk Management', icon: '🛡️' }
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Strategy Builder</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure your automated trading strategy
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strategy Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="input w-full"
                  placeholder="Enter strategy name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strategy Type
                </label>
                <select
                  value={config.type}
                  onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value, parameters: {} }))}
                  className="input w-full"
                >
                  {strategyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {strategyTypes.find(t => t.value === config.type)?.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trading Symbol
                  </label>
                  <select
                    value={config.symbol}
                    onChange={(e) => setConfig(prev => ({ ...prev, symbol: e.target.value }))}
                    className="input w-full"
                  >
                    {symbols.map((symbol) => (
                      <option key={symbol.value} value={symbol.value}>
                        {symbol.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeframe
                  </label>
                  <select
                    value={config.timeframe}
                    onChange={(e) => setConfig(prev => ({ ...prev, timeframe: e.target.value }))}
                    className="input w-full"
                  >
                    {timeframes.map((tf) => (
                      <option key={tf.value} value={tf.value}>
                        {tf.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.isActive}
                    onChange={(e) => setConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Activate strategy immediately</span>
                </label>
              </div>
            </div>
          )}

          {/* Strategy Parameters Tab */}
          {activeTab === 'parameters' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  {strategyTypes.find(t => t.value === config.type)?.label} Parameters
                </h4>
                {getStrategyParameters(config.type).map((param) => (
                  <div key={param.key} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {param.label}
                    </label>
                    <input
                      type={param.type}
                      value={config.parameters[param.key] || param.default}
                      onChange={(e) => handleParameterChange(param.key, param.type === 'number' ? Number(e.target.value) : e.target.value)}
                      className="input w-full"
                      min={param.min}
                      max={param.max}
                      step={param.step || 1}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Management Tab */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Risk Management Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Position Size (% of account)
                    </label>
                    <input
                      type="number"
                      value={config.riskSettings.maxPositionSize * 100}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        riskSettings: {
                          ...prev.riskSettings,
                          maxPositionSize: Number(e.target.value) / 100
                        }
                      }))}
                      className="input w-full"
                      min="1"
                      max="100"
                      step="1"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Maximum percentage of account to risk per trade
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Daily Loss (% of account)
                    </label>
                    <input
                      type="number"
                      value={config.riskSettings.maxDailyLoss}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        riskSettings: {
                          ...prev.riskSettings,
                          maxDailyLoss: Number(e.target.value)
                        }
                      }))}
                      className="input w-full"
                      min="1"
                      max="20"
                      step="0.5"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Stop trading if daily loss exceeds this amount
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stop Loss (%)
                    </label>
                    <input
                      type="number"
                      value={config.riskSettings.stopLossPercent}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        riskSettings: {
                          ...prev.riskSettings,
                          stopLossPercent: Number(e.target.value)
                        }
                      }))}
                      className="input w-full"
                      min="0.1"
                      max="10"
                      step="0.1"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Automatic stop loss percentage
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Take Profit (%)
                    </label>
                    <input
                      type="number"
                      value={config.riskSettings.takeProfitPercent}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        riskSettings: {
                          ...prev.riskSettings,
                          takeProfitPercent: Number(e.target.value)
                        }
                      }))}
                      className="input w-full"
                      min="0.1"
                      max="20"
                      step="0.1"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Automatic take profit percentage
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Strategy'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StrategyBuilder;










