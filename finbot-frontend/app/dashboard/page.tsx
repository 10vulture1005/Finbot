"use client";

import React from "react";
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
  Legend,
} from "recharts";

// Mock Data
const performanceData = [
  { month: "Jan", value: 10000 },
  { month: "Feb", value: 12500 },
  { month: "Mar", value: 11800 },
  { month: "Apr", value: 14200 },
  { month: "May", value: 13900 },
  { month: "Jun", value: 16500 },
  { month: "Jul", value: 18200 },
  { month: "Aug", value: 17800 },
  { month: "Sep", value: 21000 },
  { month: "Oct", value: 24500 },
  { month: "Nov", value: 23800 },
  { month: "Dec", value: 28450 },
];

const allocationData = [
  { name: "Stocks", value: 65, color: "var(--chart-1)" },
  { name: "SGBs", value: 15, color: "var(--chart-2)" },
  { name: "Mutual Funds", value: 10, color: "var(--chart-3)" },
  { name: "Crypto", value: 5, color: "var(--chart-4)" },
  { name: "Cash", value: 5, color: "var(--chart-5)" },
];

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

import Link from "next/link";

const QuickActionBtn = ({ icon: Icon, label, href }: { icon: any, label: string, href: string }) => (
    <Link href={href} className="flex items-center gap-3 p-4 bg-card hover:bg-muted/50 border border-border/60 rounded-[var(--radius)] transition-all group text-left">
        <div className="p-2 rounded-md bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Icon size={18} />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
)

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 p-2 md:p-0 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Overview</h1>
          <p className="text-sm text-muted-foreground">Portfolio performance and analytics.</p>
        </div>
        <div className="flex gap-2">
            <button className="text-sm font-medium px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:opacity-90 transition-opacity">
                Download Report
            </button>
        </div>
      </div>

      {/* KPI Grid - 12 Column Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 gap-4">
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <KPICard
                title="Total Investment"
                value="₹12.45L"
                icon={Briefcase}
                subtitle="Cap."
            />
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
             <KPICard
                title="Current Value"
                value="₹14.89L"
                icon={DollarSign}
                trend="up"
                trendValue="+19.6%"
                subtitle="Total"
            />
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <KPICard
                title="Today's P&L"
                value="+₹12.4k"
                icon={Activity}
                trend="up"
                trendValue="+0.8%"
                subtitle="Intraday"
            />
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
             <KPICard
                title="Net Returns"
                value="+₹2.44L"
                icon={Zap}
                trend="up"
                trendValue="+19.6%"
                subtitle="All time"
            />
        </div>
         <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <KPICard
                title="Risk Score"
                value="6.5"
                icon={ShieldCheck}
                trend="down"
                trendValue="Mod."
                subtitle="Volatility"
            />
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
             <KPICard
                title="Health"
                value="89"
                icon={Activity}
                trend="up"
                trendValue="Exc."
                subtitle="Score"
            />
        </div>
      </div>

        {/* Main Charts & Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-6">
            
            {/* Performance Chart - Primary Focus (8 cols) */}
            <Card className="lg:col-span-2 xl:col-span-8 flex flex-col">
                <CardHeader 
                    title="Growth Trajectory" 
                    action={<MoreHorizontal size={18} />}
                />
                
                <div className="flex-1 h-[320px] w-full px-4 pb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    cornerRadius={4}
                                    strokeWidth={0}
                                >
                                    {allocationData.map((entry, index) => (
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
                                 <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total</p>
                                 <p className="text-xl font-bold text-foreground tabular-nums">100%</p>
                             </div>
                         </div>
                     </div>
                     {/* Legend */}
                     <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-2">
                        {allocationData.slice(0,4).map((item) => (
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
                            Technology exposure is high (40%).
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            Consider rebalancing into defensive sectors.
                        </p>
                        <button className="text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-md transition-colors flex items-center gap-1">
                            Full Analysis <ArrowRight size={12} />
                        </button>
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
