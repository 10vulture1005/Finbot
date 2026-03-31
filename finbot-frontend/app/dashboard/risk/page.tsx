"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
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
  Cell
} from "recharts";
import { usePortfolio } from "@/app/context/PortfolioContext";
import { analyzePortfolio } from "@/app/services/quantService";
import EmptyState from "@/components/EmptyState";

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

export default function RiskPage() {
  const { portfolio, loading } = usePortfolio();
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
      // Auto-analyze on load if portfolio exists
      if (portfolio.length > 0 && !analysis) {
          runAnalysis();
      }
  }, [portfolio.length]); // ESLint: ignore analysis dep

  const runAnalysis = async () => {
      setAnalyzing(true);
      try {
          const res = await analyzePortfolio();
          if (res.success && res.data) {
              setAnalysis(res.data);
          }
      } catch (e) {
          console.error("Analysis failed", e);
      } finally {
          setAnalyzing(false);
      }
  };

  // 1. Concentration Metrics from Portfolio
  const totalValue = (portfolio || []).reduce((sum, h) => sum + (h.market_value || 0), 0);
  
  const topConcentration = (portfolio || [])
    .map(h => ({
        name: h.symbol,
        value: totalValue > 0 ? parseFloat(((h.market_value || 0) / totalValue * 100).toFixed(1)) : 0,
        fill: "var(--color-primary)" // Simplify color for now
    }))
    .sort((a,b) => b.value - a.value)
    .slice(0, 5);

  const topHoldingPct = topConcentration.length > 0 ? topConcentration[0].value : 0;

  // 2. Risk Metrics from Analysis (Mock fallback if analysis not ready/failed?)
  // Ideally we show skeleton. For now, use analysis data or defaults.
  // We'll show "N/A" if no analysis.
  
  if (loading) return <div>Loading...</div>;
  if (!portfolio || portfolio.length === 0) return <EmptyState title="No Risk Data" description="Add stocks to analyze risk." actionLabel="Add Stock" actionHref="/dashboard/add-stock" />;

  const riskScore = "N/A"; // Risk Score generator was removed during refactoring, can be re-added later.
  const volatility = analysis?.expected_volatility ? (analysis.expected_volatility * 100).toFixed(1) + "%" : "N/A";
  const sharpe = analysis?.sharpe_ratio ? analysis.sharpe_ratio.toFixed(2) : "N/A";
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1600px] mx-auto p-4 md:p-0 pb-12">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Risk & Health</h1>
          <p className="text-sm text-muted-foreground">Quantitative risk breakdown and rebalancing signals.</p>
        </div>
        <button 
            onClick={runAnalysis} 
            disabled={analyzing}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
        >
            {analyzing ? "Analyzing..." : "Refresh Analysis"}
        </button>
      </div>

      {/* Section 1: Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-1 border-l-4 border-l-primary relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                   <ShieldAlert size={120} />
               </div>
               <h3 className="text-sm font-medium text-muted-foreground mb-4">Portfolio Volatility expected</h3>
               <div className="flex items-end gap-3 mb-2">
                   <span className="text-5xl font-bold text-foreground">{volatility}</span>
               </div>
               <p className="text-sm font-medium text-muted-foreground">Mathematical Minimum Risk</p>
          </Card>

          <Card className="p-6 md:col-span-2 flex flex-col justify-center">
              <div className="flex items-start gap-4">
                   <div className="p-3 rounded-full bg-primary/10 text-primary shrink-0">
                       <Activity size={24} />
                   </div>
                   <div>
                       <h3 className="font-semibold text-lg mb-1">AI Risk Summary</h3>
                       <p className="text-muted-foreground text-sm leading-relaxed">
                           {analysis?.summary || "Run analysis to get AI insights on your portfolio risk."}
                       </p>
                   </div>
              </div>
          </Card>
      </div>

      {/* Section: Concentration */}
      <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" /> Concentration Risk
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <Card className="p-6">
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
                      Top holding accounts for <span className="font-bold text-foreground">{topHoldingPct}%</span> of your portfolio.
                  </div>
              </Card>

              {/* Metrics */}
              <Card className="p-4 grid grid-cols-2 gap-4">
                  <MetricItem 
                      label="Volatility" 
                      value={volatility} 
                      explanation="Standard deviation of returns."
                      status={parseFloat(volatility) > 20 ? 'risky' : 'neutral'}
                  />
                   <MetricItem 
                      label="Sharpe Ratio" 
                      value={sharpe} 
                      explanation="Return per unit of risk."
                      status={parseFloat(sharpe) > 1 ? 'good' : 'neutral'}
                  />
              </Card>
          </div>
      </div>

    </div>
  );
}
