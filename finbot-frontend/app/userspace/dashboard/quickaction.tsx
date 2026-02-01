import React from 'react';
import { MessageSquare } from 'lucide-react';

interface QuickActionsProps {
  darkMode: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({ darkMode }) => {
  const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#111827';
  const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

  return (
    <div style={{
      backgroundColor: cardBg,
      borderRadius: '8px',
      padding: '24px',
      border: `1px solid ${borderColor}`,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: textColor, marginBottom: '16px' }}>Quick Actions</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <button style={{
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '8px',
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s'
        }}>
          Add Stock
        </button>
        <button style={{
          padding: '12px 24px',
          backgroundColor: '#06b6d4',
          color: 'white',
          borderRadius: '8px',
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s'
        }}>
          View Portfolio
        </button>
        <button style={{
          padding: '12px 24px',
          backgroundColor: darkMode ? '#2d3548' : '#f3f4f6',
          color: textColor,
          borderRadius: '8px',
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <MessageSquare size={16} />
          Ask AI
        </button>
      </div>
    </div>
  );
};
export default QuickActions;