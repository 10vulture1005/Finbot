import React from 'react';
import { TrendingUp, TrendingDown, Sun, Moon, Menu, X, ChevronRight, LayoutDashboard, Briefcase, Shield, Sparkles, BarChart3, Target, MessageSquare, Settings, Circle } from 'lucide-react';

// Sidebar Component
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}
interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}
const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Briefcase, label: 'Portfolio', active: false },
  { icon: Circle, label: 'Holdings', active: false },
  { icon: Shield, label: 'Risk & Health', active: false },
  { icon: Sparkles, label: 'AI Insights', active: false },
  { icon: BarChart3, label: 'Stock Analysis', active: false },
  { icon: Target, label: 'Goals & Planning', active: false },
  { icon: MessageSquare, label: 'AI Chat', active: false },
  { icon: Settings, label: 'Settings', active: false }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, darkMode }) => {
  const sidebarBg = darkMode ? '#1a1d2e' : '#1e293b';
  const borderColor = darkMode ? '#2d3548' : '#334155';

  return (
    <>
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40
          }}
          onClick={onClose}
          className="lg-hidden"
        />
      )}
      <aside style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        width: '256px',
        backgroundColor: sidebarBg,
        borderRight: `1px solid ${borderColor}`,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s'
      }}
      className="sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '24px', borderBottom: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f1f5f9' }}>WealthAI</h1>
              <button 
                onClick={onClose}
                style={{ color: '#f1f5f9', background: 'none', border: 'none', cursor: 'pointer' }}
                className="lg-hidden"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <nav style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {menuItems.map((item, index) => (
              <button
                key={index}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  backgroundColor: item.active ? '#3b82f6' : 'transparent',
                  color: item.active ? 'white' : '#cbd5e1',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '4px'
                }}
                className="menu-item"
              >
                <item.icon />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div style={{ padding: '16px', borderTop: `1px solid ${borderColor}` }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            className="user-profile">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                JD
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>John Doe</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>john@example.com</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};



export default Sidebar;