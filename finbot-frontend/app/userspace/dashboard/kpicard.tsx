
import React from "react";
import { TrendingUp,TrendingDown } from "lucide-react";


// KPI Card Component
interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changePercent?: string;
  isPositive?: boolean;
  subtitle?: string;
  darkMode?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, changePercent, isPositive, subtitle, darkMode }) => {
  const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
  const borderColor = darkMode ? '#2d3548' : '#e5e7eb';
  const textColor = darkMode ? '#e2e8f0' : '#111827';
  const mutedColor = darkMode ? '#94a3b8' : '#6b7280';

  return (
    <div style={{
      backgroundColor: cardBg,
      borderRadius: '8px',
      padding: '24px',
      border: `1px solid ${borderColor}`,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.2s'
    }}
    className="kpi-card">
      <div style={{ fontSize: '14px', color: mutedColor, marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '30px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>{value}</div>
      {change && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: isPositive ? '#10b981' : '#ef4444' }}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{change} ({changePercent})</span>
        </div>
      )}
      {subtitle && (
        <div style={{ fontSize: '14px', color: mutedColor, marginTop: '8px' }}>{subtitle}</div>
      )}
    </div>
  );
};
export default KPICard;