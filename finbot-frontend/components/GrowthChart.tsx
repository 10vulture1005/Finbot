"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PortfolioHistoryItem } from '@/app/services/portfolioService';

interface GrowthChartProps {
  history: PortfolioHistoryItem[];
  darkMode: boolean;
}

const GrowthChart: React.FC<GrowthChartProps> = ({ history, darkMode }) => {
  const data = history.map(h => ({
      date: new Date(h.date).toLocaleDateString(),
      value: h.total_value
  }));

  if (data.length === 0) {
      return (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? '#94a3b8' : '#6b7280' }}>
              No history data available
          </div>
      );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
             dataKey="date" 
             stroke={darkMode ? '#4b5563' : '#9ca3af'}
             tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }}
          />
          <YAxis 
             stroke={darkMode ? '#4b5563' : '#9ca3af'}
             tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }}
             tickFormatter={(val) => `₹${val}`}
          />
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
          <Tooltip 
             contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#e5e7eb' }}
             itemStyle={{ color: '#3b82f6' }}
             formatter={(value: any) => `₹${Number(value).toFixed(2)}`}
          />
          <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrowthChart;
