import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';


// AI Insight Component
interface AIInsightProps {
  message: string;
  impact: string;
  confidence: number;
  darkMode: boolean;
}

const AIInsight: React.FC<AIInsightProps> = ({ message, impact, confidence, darkMode }) => {
  const textColor = darkMode ? '#e2e8f0' : '#111827';

  return (
    <div style={{
      background: darkMode ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.15))' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1))',
      borderRadius: '8px',
      padding: '24px',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sparkles size={20} style={{ color: '#3b82f6' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: textColor }}>AI Insight</h3>
      </div>
      <div>
        <p style={{ color: textColor, lineHeight: '1.6', marginBottom: '16px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            color: darkMode ? '#60a5fa' : '#2563eb',
            fontSize: '12px',
            fontWeight: '500',
            borderRadius: '9999px'
          }}>
            {impact}
          </span>
          <span style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(6, 182, 212, 0.2)',
            color: darkMode ? '#22d3ee' : '#0891b2',
            fontSize: '12px',
            fontWeight: '500',
            borderRadius: '9999px'
          }}>
            {confidence}% Confidence
          </span>
        </div>
        // ... existing AIInsight component code ...


        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#3b82f6',
          fontWeight: '500',
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }}>
          View detailed analysis
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};        export default AIInsight;