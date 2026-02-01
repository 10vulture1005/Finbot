import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PortfolioDataPoint {
  month: string;
  value: number;
}

interface PerformanceChartProps {
  data: PortfolioDataPoint[];
  darkMode: boolean;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, darkMode, timeRange, onTimeRangeChange }) => {
  const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#111827';
  const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
  const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

  return (
    <div style={{
      backgroundColor: cardBg,
      borderRadius: '8px',
      padding: '24px',
      border: `1px solid ${borderColor}`,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: textColor }}>Portfolio Performance</h3>
          <p style={{ fontSize: '14px', color: mutedColor }}>Last 12 months</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['1M', '3M', '6M', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                backgroundColor: timeRange === range ? '#3b82f6' : (darkMode ? '#2d3548' : '#f3f4f6'),
                color: timeRange === range ? 'white' : (darkMode ? '#94a3b8' : '#6b7280'),
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: '320px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis 
              dataKey="month" 
              stroke={darkMode ? '#94a3b8' : '#6b7280'}
              tick={{ fill: darkMode ? '#94a3b8' : '#6b7280', fontSize: 12 }}
            />
            <YAxis 
              stroke={darkMode ? '#94a3b8' : '#6b7280'}
              tick={{ fill: darkMode ? '#94a3b8' : '#6b7280', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                color: textColor
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;