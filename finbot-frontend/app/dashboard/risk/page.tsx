"use client";

import React from "react";
import { 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingDown, 
  TrendingUp,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";

// --- Mock Data ---

const riskOverview = {
  riskScore: 7.2,
  healthScore: 65,
  summary: "Portfolio is heavily concentrated in Technology, increasing volatility. Downside protection is weak against market corrections."
};

const topConcentration = [
  { name: "NVDA", value: 45, fill: "var(--color-chart-1)" },
  { name: "TSLA", value: 24, fill: "var(--color-chart-2)" },
  { name: "AAPL", value: 12, fill: "var(--color-chart-3)" },
  { name: "MSFT", value: 8, fill: "var(--color-chart-4)" },
  { name: "AMZN", value: 6, fill: "var(--color-chart-5)" },
];

const sectorHHI = {
  value: 0.42, // High concentration
  status: "High",
  explanation: "Herfindahl-Hirschman Index (HHI) measures sector concentration. Higher is riskier."
};

const correlationMatrix = [
    [1.0, 0.85, 0.76, 0.12],
    [0.85, 1.0, 0.65, 0.05],
    [0.76, 0.65, 1.0, -0.15],
    [0.12, 0.05, -0.15, 1.0]
];
const correlationLabels = ["Tech", "Cons. Disc", "Comm.", "Bonds"];

const downsideMetrics = {
    volatility: "24.5%",
    maxDrawdown: "-32.4%",
    var95: "₹45,200", // Value at Risk
    expectedShortfall: "₹62,100"
};

const qualityMetrics = {
    sharpe: 1.85,
    sortino: 2.15,
    benchmarkBeta: 1.24
};

const rebalancingSignals = [
    {
        id: 1,
        type: "Critical",
        issue: "Single Stock Exposure > 20%",
        action: "Reduce NVDA by 15%",
        impact: "Improves Diversification Score by 12 points."
    },
    {
        id: 2,
        type: "Warning",
        issue: "High Sector Correlation",
        action: "Add Defensive Assets (Gold/Bonds)",
        impact: "Reduces Max Drawdown risk by ~8%."
    }
];

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card text-card-foreground rounded-[var(--radius)] border border-border/60 shadow-sm ${className}`}>
    {children}
  </div>
);

const MetricItem = ({ label, value, explanation, status, trend }: { 
    label: string, 
    value: string | number, 
    explanation: string, 
    status?: 'good' | 'neutral' | 'risky',
    trend?: 'up' | 'down'
}) => {
    const statusColor = 
        status === 'good' ? 'text-emerald-500' : 
        status === 'risky' ? 'text-rose-500' : 'text-yellow-500';
    
    return (
        <div className="flex flex-col gap-1 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                {label}
                <div className="relative group-hover:block hidden">
                   <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-popover border border-border text-popover-foreground text-xs p-2 rounded shadow-lg z-10">
                       {explanation}
                   </div>
                   <HelpCircle size={12} className="cursor-help" />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${status ? statusColor : 'text-foreground'}`}>{value}</span>
                {trend && (
                    trend === 'up' ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />
                )}
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1">{explanation}</p>
        </div>
    );
};

const CorrelationCell = ({ value }: { value: number }) => {
    // Color scale from -1 (green) to 1 (red)
    const intensity = Math.abs(value);
    let bg = "bg-muted";
    let text = "text-foreground";
    
    if (value > 0.7) {
        bg = `bg-rose-500/${Math.floor(intensity * 30)}`; // High correlation = risky
        text = "text-rose-600 dark:text-rose-400";
    } else if (value < 0.3 && value > -0.3) {
        bg = `bg-emerald-500/${Math.floor((1-intensity) * 20)}`; // Low correlation = good
        text = "text-emerald-600 dark:text-emerald-400";
    } else if (value <= -0.3) {
        bg = `bg-blue-500/${Math.floor(intensity * 30)}`; // Negative correlation = distinct
        text = "text-blue-600 dark:text-blue-400";
    }

    return (
        <div className={`w-full h-10 ${bg} flex items-center justify-center rounded text-xs font-medium ${text} transition-all hover:scale-105`}>
            {value.toFixed(2)}
        </div>
    );
};


export default function RiskPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1600px] mx-auto p-4 md:p-0">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Risk & Health</h1>
          <p className="text-sm text-muted-foreground">Quantitative risk breakdown and rebalancing signals.</p>
        </div>
      </div>

      {/* Section 1: Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-1 border-l-4 border-l-rose-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                   <ShieldAlert size={120} />
               </div>
               <h3 className="text-sm font-medium text-muted-foreground mb-4">Portfolio Risk Score (0-10)</h3>
               <div className="flex items-end gap-3 mb-2">
                   <span className="text-5xl font-bold text-foreground">{riskOverview.riskScore}</span>
                   <span className="text-xl text-muted-foreground font-medium mb-1">/ 10</span>
               </div>
               <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mb-4">
                   <div className="bg-rose-500 h-full w-[72%]"></div>
               </div>
               <p className="text-sm font-medium text-rose-500">Risk Level: High</p>
          </Card>

          <Card className="p-6 md:col-span-2 flex flex-col justify-center">
              <div className="flex items-start gap-4">
                   <div className="p-3 rounded-full bg-primary/10 text-primary shrink-0">
                       <Activity size={24} />
                   </div>
                   <div>
                       <h3 className="font-semibold text-lg mb-1">AI Risk Summary</h3>
                       <p className="text-muted-foreground text-sm leading-relaxed">
                           {riskOverview.summary}
                       </p>
                       <div className="mt-4 flex items-center gap-6">
                           <div>
                               <p className="text-xs text-muted-foreground mb-0.5">Health Score</p>
                               <p className="text-xl font-bold text-yellow-500">{riskOverview.healthScore}/100</p>
                           </div>
                           <div className="h-8 w-[1px] bg-border"></div>
                           <div>
                               <p className="text-xs text-muted-foreground mb-0.5">Primary Driver</p>
                               <p className="text-sm font-medium">Concentration (Tech)</p>
                           </div>
                       </div>
                   </div>
              </div>
          </Card>
      </div>

      {/* Section 2: Where Risk Comes From */}
      <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" /> Source of Risk
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Concentration */}
              <Card className="p-6 lg:col-span-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">Top-5 Holding Concentration</h3>
                  <div className="h-[200px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={topConcentration} layout="vertical" margin={{ left: 10 }}>
                               <XAxis type="number" hide />
                               <YAxis dataKey="name" type="category" width={40} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                               <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px' }} />
                               <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {topConcentration.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                               </Bar>
                           </BarChart>
                       </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-xs text-center text-muted-foreground">
                      NVDA accounts for <span className="font-bold text-foreground">45%</span> of your portfolio.
                  </div>
              </Card>

              {/* HHI Index */}
              <Card className="p-6 lg:col-span-1 flex flex-col items-center justify-center text-center">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Sector Concentration (HHI)</h3>
                  <div className="relative w-40 h-40 flex items-center justify-center bg-muted/30 rounded-full mb-4 border-8 border-transparent border-t-rose-500 border-r-rose-500 border-b-rose-500/30 border-l-rose-500/30 rotate-45">
                       <div className="-rotate-45 text-center">
                            <span className="text-3xl font-bold text-foreground block">{sectorHHI.value}</span>
                            <span className="text-xs font-bold text-rose-500 uppercase">{sectorHHI.status}</span>
                       </div>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                      {sectorHHI.explanation}
                  </p>
              </Card>

              {/* Correlation */}
              <Card className="p-6 lg:col-span-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Asset Correlation Matrix</h3>
                  <div className="space-y-2">
                       {/* Header Row */}
                       <div className="grid grid-cols-5 gap-1 text-[10px] text-muted-foreground text-center mb-2">
                           <div></div>
                           {correlationLabels.map(l => <div key={l}>{l.substring(0,4)}</div>)}
                       </div>
                       {/* Rows */}
                       {correlationMatrix.map((row, i) => (
                           <div key={i} className="grid grid-cols-5 gap-1 items-center">
                               <div className="text-[10px] font-medium text-muted-foreground">{correlationLabels[i].substring(0,4)}</div>
                               {row.map((val, j) => (
                                   <CorrelationCell key={`${i}-${j}`} value={val} />
                               ))}
                           </div>
                       ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-4 text-center">
                      High correlation means assets move together (Less Diversified).
                  </p>
              </Card>
          </div>
      </div>

      {/* Section 3 & 4: Quantitative Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Downside Risk */}
          <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingDown size={18} className="text-rose-500" /> Downside Risk
              </h2>
              <Card className="p-4 grid grid-cols-2 gap-4">
                  <MetricItem 
                      label="Max Drawdown" 
                      value={downsideMetrics.maxDrawdown} 
                      explanation="Largest drop from peak to trough. Shows historical loss potential."
                      status={parseFloat(downsideMetrics.maxDrawdown) < -20 ? 'risky' : 'neutral'}
                  />
                  <MetricItem 
                      label="Value at Risk (95%)" 
                      value={downsideMetrics.var95} 
                      explanation="Maximum estimated loss on a bad market day (95% confidence)."
                      status="risky"
                  />
                  <MetricItem 
                      label="Expected Shortfall" 
                      value={downsideMetrics.expectedShortfall} 
                      explanation="Average loss in scenarios worse than the VaR threshold."
                      status="risky"
                  />
                  <MetricItem 
                      label="Portfolio Volatility" 
                      value={downsideMetrics.volatility} 
                      explanation="Standard deviation of returns. Higher means more price swings."
                      status="neutral"
                  />
              </Card>
          </div>

          {/* Risk Quality */}
          <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" /> Risk-Adjusted Quality
              </h2>
              <Card className="p-4 grid grid-cols-2 gap-4">
                  <MetricItem 
                      label="Sharpe Ratio" 
                      value={qualityMetrics.sharpe} 
                      explanation="Return per unit of total risk. > 1 is good, > 2 is excellent."
                      status={qualityMetrics.sharpe > 1.5 ? 'good' : 'neutral'}
                  />
                  <MetricItem 
                      label="Sortino Ratio" 
                      value={qualityMetrics.sortino} 
                      explanation="Return per unit of downside risk. Better for volatile assets."
                      status="good"
                  />
                  <MetricItem 
                      label="Beta vs Benchmark" 
                      value={qualityMetrics.benchmarkBeta} 
                      explanation="Sensitivity to market moves. 1.0 = Market, >1 = Aggressive."
                      status="risky"
                  />
                  <MetricItem 
                      label="Diversification Ratio" 
                      value="1.8" 
                      explanation="Ratio of weighted average risk to portfolio risk."
                      status="neutral"
                  />
              </Card>
          </div>
      </div>

      {/* Section 5: Rebalancing Signals */}
      <div>
          <h2 className="text-lg font-semibold mb-4">Rebalancing Signals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rebalancingSignals.map((signal) => (
                  <Card key={signal.id} className="p-5 flex flex-col justify-between border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                       <div className="mb-4">
                           <div className="flex justify-between items-start mb-2">
                               <span className="text-xs font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                                   {signal.type}
                               </span>
                               <ArrowRight size={16} className="text-muted-foreground" />
                           </div>
                           <h4 className="font-semibold text-lg">{signal.issue}</h4>
                           <p className="text-sm text-muted-foreground mt-1">Suggested: <span className="font-medium text-foreground">{signal.action}</span></p>
                       </div>
                       <div className="pt-4 border-t border-border mt-auto">
                           <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                               <TrendingUp size={12} /> {signal.impact}
                           </p>
                       </div>
                  </Card>
              ))}
          </div>
      </div>

    </div>
  );
}
