import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceData {
  date: string;
  equity: number;
  drawdown: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  height?: number;
  showDrawdown?: boolean;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  data, 
  height = 300, 
  showDrawdown = false 
}) => {
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {showDrawdown ? 'Drawdown' : 'Equity Curve'}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            stroke="#666"
            fontSize={12}
          />
          <Tooltip 
            labelFormatter={(value) => formatDate(value as string)}
            formatter={(value: number) => [formatCurrency(value), showDrawdown ? 'Drawdown' : 'Equity']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey={showDrawdown ? "drawdown" : "equity"} 
            stroke={showDrawdown ? "#ef4444" : "#10b981"}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: showDrawdown ? "#ef4444" : "#10b981", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;










