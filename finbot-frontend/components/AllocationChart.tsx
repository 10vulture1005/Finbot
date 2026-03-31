"use client";

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PortfolioStock } from '@/app/services/portfolioService';

interface AllocationChartProps {
  holdings: PortfolioStock[];
  darkMode: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const AllocationChart: React.FC<AllocationChartProps> = ({ holdings, darkMode }) => {
  
  const data = useMemo(() => {
    const allocationMap: Record<string, number> = {};
    
    holdings.forEach(h => {
      // Use sector if available, else Symbol
      const key = h.sector && h.sector !== "Unknown" ? h.sector : h.symbol;
      const val = h.market_value || (h.quantity * (h.current_price || h.avg_price));
      
      allocationMap[key] = (allocationMap[key] || 0) + val;
    });

    const totalval = Object.values(allocationMap).reduce((a, b) => a + b, 0);

    return Object.entries(allocationMap).map(([name, value]) => ({
      name,
      value,
      percent: totalval > 0 ? (value / totalval) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [holdings]);

  if (data.length === 0) {
      return (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? '#94a3b8' : '#6b7280' }}>
              No data to display
          </div>
      );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => `₹${Number(value).toFixed(2)}`}
            contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#e5e7eb' }}
            itemStyle={{ color: darkMode ? '#e2e8f0' : '#111827' }}
          />
          <Legend 
             layout="vertical" 
             verticalAlign="middle" 
             align="right"
             iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AllocationChart;
