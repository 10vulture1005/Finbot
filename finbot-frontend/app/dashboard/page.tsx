"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ShieldCheck,
  Zap,
  Plus,
  Briefcase,
  Search,
  Brain,
  MessageSquare,
  PieChart as PieChartIcon,
  ArrowRight,
  MoreHorizontal
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getPortfolio, getHistory, getCurrentUser, PortfolioStock, PortfolioHistoryItem, UserPortfolioData } from "@/app/services/portfolioService";
import api from "@/app/services/api";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

// Reusable UI Components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card text-card-foreground rounded-[var(--radius)] border border-border/60 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between p-6 pb-2">
    <div>
      <h3 className="font-medium text-sm text-muted-foreground tracking-wide uppercase">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{action}</div>}
  </div>
);

const KPICard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  subtitle
}: {
  title: string;
  value: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  subtitle?: string;
}) => (
  <Card className="p-6 flex flex-col justify-between h-full hover:border-primary/20 transition-colors duration-300">
    <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon size={18} className="text-muted-foreground/70" />
    </div>
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
         {trend && (
          <span
            className={`flex items-center font-medium ${
              trend === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : trend === "down"
                ? "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground"
            }`}
          >
            {trend === "up" ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            {trendValue}
          </span>
        )}
        <span className="text-muted-foreground/60">{subtitle}</span>
      </div>
    </div>
  </Card>
);

const QuickActionBtn = ({ icon: Icon, label, href }: { icon: any, label: string, href: string }) => (
    <Link href={href} className="flex items-center gap-3 p-4 bg-card hover:bg-muted/50 border border-border/60 rounded-[var(--radius)] transition-all group text-left">
        <div className="p-2 rounded-md bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Icon size={18} />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
)

import { usePortfolio } from "@/app/context/PortfolioContext";

export default function DashboardPage() {
  const { portfolio, history, user, loading } = usePortfolio();
  const [growthData, setGrowthData] = React.useState<{date:string,value:number}[]>([]);

  // Fetch real historical growth data from the dedicated endpoint
  React.useEffect(() => {
    if (loading) return;
    api.get('/portfolio/growth').then((res: any) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setGrowthData(res.data);
      }
    }).catch(() => {});
  }, [loading]);

  // Derived Metrics using useMemo
  const metrics = useMemo(() => {
      const totalValue = (portfolio || []).reduce((sum, h) => sum + (h.market_value || (h.quantity * (h.current_price || 0))), 0);
      const totalInvestment = (portfolio || []).reduce((sum, h) => sum + (h.quantity * h.avg_price), 0);
      const netReturn = totalValue - totalInvestment;
      const netReturnPct = totalInvestment > 0 ? (netReturn / totalInvestment) * 100 : 0;
      
      // Daily P&L approximation: sum of (daily_return * market_value)
      const todaysPnL = (portfolio || []).reduce((sum, h) => sum + ((h.daily_return || 0) * (h.market_value || 0)), 0);
      const todaysPnLPct = totalValue > 0 ? (todaysPnL / totalValue) * 100 : 0;

      // Allocation Data
      const allocation = (portfolio || [])
            .map((h, i) => ({
                name: h.symbol,
                value: totalValue > 0 ? parseFloat(((h.market_value || 0) / totalValue * 100).toFixed(1)) : 0,
                color: `var(--chart-${(i % 5) + 1})`
            }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 5);

      // History Data Formatting
      // Prefer DB history, then real-time growth, then empty
      const sourceHistory = history.length > 0 
          ? history.map(h => ({ date: h.date, value: h.total_value }))
          : growthData;
      
      const formattedHistory = sourceHistory.map(h => ({
          month: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: h.value,
          originalDate: h.date
      }));

      return {
          totalValue,
          totalInvestment,
          netReturn,
          netReturnPct,
          todaysPnL,
          todaysPnLPct,
          allocation,
          formattedHistory
      };
  }, [portfolio, history, growthData]);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center space-y-4 flex-col">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
          </div>
      )
  }

  if (!portfolio || portfolio.length === 0) {
      return (
        <div className="space-y-8 p-2 md:p-0 max-w-[1600px] mx-auto">
             <div className="flex justify-between items-end">
                <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Overview</h1>
                <p className="text-sm text-muted-foreground">Portfolio performance and analytics.</p>
                </div>
            </div>
            <EmptyState 
                title="Your portfolio is empty"
                description="Start building your wealth by adding your first stock position."
                actionLabel="Add Stock"
                actionHref="/dashboard/add-stock"
            />
        </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 p-2 md:p-0 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Overview</h1>
          <p className="text-sm text-muted-foreground">Portfolio performance and analytics.</p>
        </div>
        <div className="flex gap-2">
            {/* <button className="text-sm font-medium px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:opacity-90 transition-opacity">
                Download Report
            </button> */}
        </div>
      </div>

      {/* KPI Grid - 12 Column Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 gap-4">
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <KPICard
                title="Total Investment"
                value={`₹${(metrics.totalInvestment / 100000).toFixed(2)}L`}
                icon={Briefcase}
                subtitle="Cap."
            />
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
             <KPICard
                title="Current Value"
                value={`₹${(metrics.totalValue / 100000).toFixed(2)}L`}
                icon={DollarSign}
                trend={metrics.netReturn >= 0 ? "up" : "down"}
                trendValue={`${metrics.netReturnPct >= 0 ? '+' : ''}${metrics.netReturnPct.toFixed(1)}%`}
                subtitle="Total"
            />
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <KPICard
                title="Today's P&L"
                value={`${metrics.todaysPnL >= 0 ? '+' : '-'}₹${Math.abs(metrics.todaysPnL / 1000).toFixed(1)}k`}
                icon={Activity}
                trend={metrics.todaysPnL >= 0 ? "up" : "down"}
                trendValue={`${metrics.todaysPnLPct >= 0 ? '+' : ''}${metrics.todaysPnLPct.toFixed(1)}%`}
                subtitle="Intraday"
            />
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
             <KPICard
                title="Net Returns"
                value={`${metrics.netReturn >= 0 ? '+' : '-'}₹${Math.abs(metrics.netReturn / 100000).toFixed(2)}L`}
                icon={Zap}
                trend={metrics.netReturn >= 0 ? "up" : "down"}
                trendValue={`${metrics.netReturnPct >= 0 ? '+' : ''}${metrics.netReturnPct.toFixed(1)}%`}
                subtitle="All time"
            />
        </div>
         <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <KPICard
                title="Risk Score"
                value={`${(user?.target_volatility || 0.15) * 100}`}
                icon={ShieldCheck}
                trend="neutral"
                trendValue="Target"
                subtitle="Volatility Target"
            />
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
             <KPICard
                title="Health"
                value="Good"
                icon={Activity}
                trend="up"
                trendValue="Stable"
                subtitle="Score"
            />
        </div>
      </div>

        {/* Main Charts & Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-6">
            
            {/* Performance Chart - Primary Focus (8 cols) */}
            <Card className="lg:col-span-2 xl:col-span-8 flex flex-col">
                <CardHeader 
                    title="Chart" 
                    action={<MoreHorizontal size={18} />}
                />
                
                <div className="flex-1 h-[320px] w-full px-4 pb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.formattedHistory.length > 0 ? metrics.formattedHistory : [{month: 'Now', value: metrics.totalValue, originalDate: new Date().toISOString()}]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                            <XAxis 
                                dataKey="month" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                tickFormatter={(value) => `₹${value/1000}k`}
                            />
                            <Tooltip 
                                cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', padding: '8px 12px' }}
                                itemStyle={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 500 }}
                                labelStyle={{ display: 'none' }}
                                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Portfolio Value"]}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="var(--chart-1)" 
                                strokeWidth={2}
                                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--chart-1)' }}
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Right Column - Insights & Allocation (4 cols) */}
            <div className="lg:col-span-1 xl:col-span-4 space-y-6">
                
                {/* Allocation Donut */}
                <Card className="flex flex-col min-h-[300px]">
                    <CardHeader title="Allocation" action={<PieChartIcon size={16} />} />
                     <div className="flex-1 relative">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={metrics.allocation}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    cornerRadius={4}
                                    strokeWidth={0}
                                >
                                    {metrics.allocation.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="text-center">
                                 <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Top 5</p>
                                 <p className="text-xl font-bold text-foreground tabular-nums">Holdings</p>
                             </div>
                         </div>
                     </div>
                     {/* Legend */}
                     <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-2">
                        {metrics.allocation.slice(0,4).map((item) => (
                            <div key={item.name} className="flex items-center gap-2 text-xs">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-muted-foreground truncate">{item.name}</span>
                                <span className="font-medium ml-auto">{item.value}%</span>
                            </div>
                        ))}
                     </div>
                </Card>

                {/* AI Insight Card - Styled Darker or Subtle */}
                <Card className="bg-gradient-to-br from-card to-accent/5 overflow-hidden relative border-primary/10">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                        <Brain size={120} />
                    </div>
                     <div className="p-6 relative z-10">
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <div className="p-1.5 bg-primary/10 rounded-md">
                                <Brain size={16} />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider">AI Analysis</span>
                        </div>
                        <h4 className="font-medium text-foreground mb-2 leading-relaxed">
                            {metrics.todaysPnL < 0 ? "Market is correcting." : "Stable growth detected."}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            {metrics.todaysPnL < 0 ? "Consider rebalancing if volatility persists." : "Portfolio aligned with target risk."}
                        </p>
                        {/* <button className="text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-md transition-colors flex items-center gap-1">
                            Full Analysis <ArrowRight size={12} />
                        </button> */}
                    </div>
                </Card>
            </div>
        </div>

        {/* Quick Actions */}
        <div>
             <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4 px-1">Quick Actions</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                 <QuickActionBtn label="Add Stock" icon={Plus} href="/dashboard/add-stock" />
                 <QuickActionBtn label="Research" icon={Search} href="/dashboard/analysis" />
                 <QuickActionBtn label="Rebalance" icon={PieChartIcon} href="/dashboard/portfolio" />
                 <QuickActionBtn label="Ask AI" icon={MessageSquare} href="/dashboard/chat" />
                 <QuickActionBtn label="Risk Analysis" icon={Activity} href="/dashboard/risk" />
             </div>
        </div>

    </div>
  );
}
