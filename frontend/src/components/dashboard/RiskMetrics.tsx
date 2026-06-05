import React from 'react';

interface RiskMetrics {
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  var95: number;
  var99: number;
  winRate: number;
  profitFactor: number;
  maxConsecutiveLosses: number;
}

interface RiskMetricsProps {
  metrics: RiskMetrics;
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ metrics }) => {
  const formatPercent = (value: number) => value.toFixed(2) + '%';
  const formatNumber = (value: number) => value.toFixed(2);

  const getRiskLevel = (value: number, thresholds: { low: number; medium: number }) => {
    if (value <= thresholds.low) return 'low';
    if (value <= thresholds.medium) return 'medium';
    return 'high';
  };

  const getDrawdownLevel = (drawdown: number) => {
    if (drawdown >= -5) return 'low';
    if (drawdown >= -15) return 'medium';
    return 'high';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-50 border-green-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'high': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const maxDrawdownLevel = getDrawdownLevel(Math.abs(metrics.maxDrawdown));
  const currentDrawdownLevel = getDrawdownLevel(Math.abs(metrics.currentDrawdown));

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Max Drawdown */}
        <div className={`p-4 rounded-lg border ${getRiskBgColor(maxDrawdownLevel)}`}>
          <div className="text-sm font-medium text-gray-500">Max Drawdown</div>
          <div className={`text-2xl font-bold ${getRiskColor(maxDrawdownLevel)}`}>
            {formatPercent(metrics.maxDrawdown)}
          </div>
        </div>

        {/* Current Drawdown */}
        <div className={`p-4 rounded-lg border ${getRiskBgColor(currentDrawdownLevel)}`}>
          <div className="text-sm font-medium text-gray-500">Current Drawdown</div>
          <div className={`text-2xl font-bold ${getRiskColor(currentDrawdownLevel)}`}>
            {formatPercent(metrics.currentDrawdown)}
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
          <div className="text-sm font-medium text-gray-500">Sharpe Ratio</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(metrics.sharpeRatio)}
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
          <div className="text-sm font-medium text-gray-500">Win Rate</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPercent(metrics.winRate)}
          </div>
        </div>

        {/* VaR 95% */}
        <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
          <div className="text-sm font-medium text-gray-500">VaR 95%</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPercent(metrics.var95)}
          </div>
        </div>

        {/* VaR 99% */}
        <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
          <div className="text-sm font-medium text-gray-500">VaR 99%</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPercent(metrics.var99)}
          </div>
        </div>

        {/* Profit Factor */}
        <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
          <div className="text-sm font-medium text-gray-500">Profit Factor</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(metrics.profitFactor)}
          </div>
        </div>

        {/* Max Consecutive Losses */}
        <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
          <div className="text-sm font-medium text-gray-500">Max Consecutive Losses</div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.maxConsecutiveLosses}
          </div>
        </div>
      </div>

      {/* Risk Summary */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Risk Assessment</h4>
        <div className="text-sm text-blue-800">
          {maxDrawdownLevel === 'high' || currentDrawdownLevel === 'high' ? (
            <span className="text-red-600 font-medium">⚠️ High Risk: Consider reducing position sizes or stopping trading.</span>
          ) : maxDrawdownLevel === 'medium' || currentDrawdownLevel === 'medium' ? (
            <span className="text-yellow-600 font-medium">⚡ Medium Risk: Monitor positions closely.</span>
          ) : (
            <span className="text-green-600 font-medium">✅ Low Risk: Portfolio is within acceptable risk parameters.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskMetrics;










