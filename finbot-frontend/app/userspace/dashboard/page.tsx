'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Sun, Moon, Menu, X, ChevronRight, LayoutDashboard, Briefcase, Shield, Sparkles, BarChart3, Target, MessageSquare, Settings, Circle } from 'lucide-react';
import Sidebar from './sidebar';
import KPICard from './kpicard';
import PerformanceChart from './performance';
import  AllocationChart  from './allocationcharts';
import AIInsight from './aiinsight';
import  QuickActions  from './quickaction';



interface PortfolioDataPoint {
  month: string;
  value: number;
}

interface AllocationItem {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface KPIData {
  totalInvestment: number;
  currentValue: number;
  todayChange: number;
  todayChangePercent: number;
  overallReturns: number;
  overallReturnsPercent: number;
  xirr: number;
  riskScore: number;
  healthScore: number;
}

interface DashboardData {
  kpis: KPIData;
  portfolioHistory: PortfolioDataPoint[];
  holdingsAllocation: AllocationItem[];
  sectorAllocation: AllocationItem[];
  aiInsight: {
    message: string;
    impact: string;
    confidence: number;
  };
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

const defaultData: DashboardData = {
  kpis: {
    totalInvestment: 950000,
    currentValue: 1168000,
    todayChange: 12400,
    todayChangePercent: 1.07,
    overallReturns: 218000,
    overallReturnsPercent: 22.95,
    xirr: 24.3,
    riskScore: 72,
    healthScore: 85
  },
  portfolioHistory: [
    { month: 'Jan', value: 850000 },
    { month: 'Feb', value: 875000 },
    { month: 'Mar', value: 920000 },
    { month: 'Apr', value: 895000 },
    { month: 'May', value: 940000 },
    { month: 'Jun', value: 980000 },
    { month: 'Jul', value: 1020000 },
    { month: 'Aug', value: 995000 },
    { month: 'Sep', value: 1050000 },
    { month: 'Oct', value: 1090000 },
    { month: 'Nov', value: 1125000 },
    { month: 'Dec', value: 1168000 }
  ],
  holdingsAllocation: [
    { name: 'Equities', value: 65, color: '#3b82f6' },
    { name: 'Bonds', value: 20, color: '#06b6d4' },
    { name: 'Real Estate', value: 10, color: '#10b981' },
    { name: 'Cash', value: 5, color: '#8b5cf6' }
  ],
  sectorAllocation: [
    { name: 'Technology', value: 35, color: '#3b82f6' },
    { name: 'Healthcare', value: 20, color: '#10b981' },
    { name: 'Finance', value: 18, color: '#06b6d4' },
    { name: 'Consumer', value: 15, color: '#f59e0b' },
    { name: 'Energy', value: 12, color: '#8b5cf6' }
  ],
  aiInsight: {
    message: 'Your portfolio shows increased exposure to Technology sector (35%), which may elevate volatility risk during market corrections.',
    impact: 'High Impact',
    confidence: 92
  }
};


const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};


class DashboardAPI {
  static async fetchDashboardData(): Promise<DashboardData> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/dashboard');
      // const data = await response.json();
      // return data;
      
      // For now, return default data after simulating network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return defaultData;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return defaultData;
    }
  }

  static async fetchPortfolioHistory(timeRange: string): Promise<PortfolioDataPoint[]> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/portfolio/history?range=${timeRange}`);
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 300));
      return defaultData.portfolioHistory;
    } catch (error) {
      console.error('Error fetching portfolio history:', error);
      return defaultData.portfolioHistory;
    }
  }
}

const Dashboard: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>('1Y');
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultData);
  const [loading, setLoading] = useState<boolean>(false);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load data when time range changes
  useEffect(() => {
    loadPortfolioHistory(timeRange);
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await DashboardAPI.fetchDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioHistory = async (range: string) => {
    try {
      const history = await DashboardAPI.fetchPortfolioHistory(range);
      setDashboardData(prev => ({ ...prev, portfolioHistory: history }));
    } catch (error) {
      console.error('Failed to load portfolio history:', error);
    }
  };

  const bgColor = darkMode ? '#0f1419' : '#f8fafc';
  const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#111827';
  const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
  const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

  const { kpis } = dashboardData;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: bgColor }}>
      <style>{`
        @media (min-width: 1024px) {
          .sidebar {
            position: static !important;
            transform: translateX(0) !important;
          }
          .lg-hidden {
            display: none !important;
          }
        }
        .kpi-card:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .menu-item:hover {
          background-color: ${darkMode ? '#374151' : '#475569'} !important;
        }
        .user-profile:hover {
          background-color: ${darkMode ? '#374151' : '#475569'};
        }
      `}</style>
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} darkMode={darkMode} />
      
      <main style={{ flex: 1, overflow: 'auto' }}>
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: darkMode ? 'rgba(15, 20, 25, 0.95)' : 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${borderColor}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  color: textColor,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                className="lg-hidden"
              >
                <Menu size={24} />
              </button>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>Dashboard</h2>
                <p style={{ fontSize: '14px', color: mutedColor }}>Welcome back, John</p>
              </div>
            </div>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                color: textColor,
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <div style={{ padding: '24px' }}>
          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ gridColumn: 'span 2' }} className="kpi-span">
              <KPICard
                title="Total Investment"
                value={formatCurrency(kpis.totalInvestment)}
                subtitle="Principal amount"
                darkMode={darkMode}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }} className="kpi-span">
              <KPICard
                title="Current Portfolio Value"
                value={formatCurrency(kpis.currentValue)}
                change={`+${formatCurrency(kpis.currentValue - kpis.totalInvestment)}`}
                changePercent={`+${((kpis.currentValue - kpis.totalInvestment) / kpis.totalInvestment * 100).toFixed(2)}%`}
                isPositive={true}
                darkMode={darkMode}
              />
            </div>
            <KPICard
              title="Overall Returns"
              value={formatCurrency(kpis.overallReturns)}
              change={`+${kpis.overallReturnsPercent}%`}
              changePercent={`XIRR: ${kpis.xirr}%`}
              isPositive={true}
              darkMode={darkMode}
            />
            <KPICard
              title="Today's P&L"
              value={formatCurrency(kpis.todayChange)}
              change={`+${kpis.todayChangePercent}%`}
              changePercent="Intraday"
              isPositive={true}
              darkMode={darkMode}
            />
            <KPICard
              title="Risk Score"
              value={`${kpis.riskScore}/100`}
              subtitle="Moderate-High"
              darkMode={darkMode}
            />
            <KPICard
              title="Health Score"
              value={`${kpis.healthScore}/100`}
              subtitle="Good"
              darkMode={darkMode}
            />
          </div>

          {/* Performance Chart */}
          <PerformanceChart
            data={dashboardData.portfolioHistory}
            darkMode={darkMode}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Allocation & AI Insights */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            <AllocationChart
              title="Holdings Allocation"
              data={dashboardData.holdingsAllocation}
              darkMode={darkMode}
            />

            <AllocationChart
              title="Sector Allocation"
              data={dashboardData.sectorAllocation}
              darkMode={darkMode}
            />

            <AIInsight
              message={dashboardData.aiInsight.message}
              impact={dashboardData.aiInsight.impact}
              confidence={dashboardData.aiInsight.confidence}
              darkMode={darkMode}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions darkMode={darkMode} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;