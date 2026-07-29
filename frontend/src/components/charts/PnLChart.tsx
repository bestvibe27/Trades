import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PnLData {
  date: string;
  pnl: number;
  cumulative: number;
}

interface PnLChartProps {
  data: PnLData[];
  height?: number;
  showCumulative?: boolean;
}

const PnLChart: React.FC<PnLChartProps> = ({ 
  data, 
  height = 300, 
  showCumulative = false 
}) => {
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {showCumulative ? 'Cumulative P&L' : 'Daily P&L'}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            formatter={(value: number) => [formatCurrency(value), showCumulative ? 'Cumulative P&L' : 'Daily P&L']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey={showCumulative ? "cumulative" : "pnl"}
            radius={[2, 2, 0, 0]}
          >
            {data.map((entry, index) => {
              const value = showCumulative ? entry.cumulative : entry.pnl;
              const fill = value >= 0 ? "#10b981" : "#ef4444";
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PnLChart;










