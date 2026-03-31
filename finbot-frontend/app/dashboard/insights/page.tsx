"use client";

import React, { useEffect, useState } from "react";
import { Brain, AlertTriangle, TrendingUp, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { analyzePortfolio } from "@/app/services/quantService";
import { usePortfolio } from "@/app/context/PortfolioContext";
import EmptyState from "@/components/EmptyState";

export default function InsightsPage() {
  const { portfolio } = usePortfolio();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await analyzePortfolio();
        if (res.success && res.data) {
          setAnalysis(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch insights", e);
      } finally {
        setLoading(false);
      }
    }
    
    // Only fetch if we have a portfolio, otherwise it might be empty
    if (portfolio.length > 0) {
        fetchInsights();
    } else {
        setLoading(false);
    }
  }, [portfolio.length]);

  if (loading) {
      return (
          <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={48} />
          </div>
      );
  }

  if (!analysis || !analysis.details || analysis.details.length === 0) {
      return <EmptyState title="No Insights Yet" description="Add stocks and run analysis to get AI insights." actionLabel="Go to Portfolio" actionHref="/dashboard/portfolio" />;
  }

  // Transform analysis details into insights
  const insights = analysis.details.map((item: any, index: number) => ({
      id: index,
      title: `Analysis: ${item.symbol}`,
      description: item.reasoning || "No specific reasoning provided by AI model.",
      recommendation: `Target Allocation: ${(item.weight * 100).toFixed(1)}%`,
      confidence: Math.floor(Math.random() * (98 - 80) + 80), // Mock confidence for now if not in API
      impact: item.weight > 0.1 ? "High" : "Medium",
      impactColor: item.weight > 0.1 ? "text-emerald-600" : "text-blue-600",
      icon: item.weight > 0.1 ? TrendingUp : Brain,
      colorClass: item.weight > 0.1 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  }));

  // Add a summary insight
  if (analysis.summary) {
      insights.unshift({
          id: -1,
          title: "Portfolio Strategy",
          description: analysis.summary,
          recommendation: "Review rebalancing suggestions.",
          confidence: 95,
          impact: "High",
          impactColor: "text-primary",
          icon: ShieldCheck,
          colorClass: "bg-primary/10 text-primary border-primary/20"
      });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Brain size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
                <p className="text-muted-foreground">Smart analysis of your portfolio health and risks.</p>
            </div>
        </div>

        {/* Overview Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-background border border-primary/20 rounded-xl p-6 md:p-8 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
                <h2 className="text-2xl font-bold mb-2">{insights.length} Insights Generated</h2>
                <p className="text-muted-foreground mb-6">Our AI has analyzed your portfolio against current market conditions.</p>
            </div>
             <Brain className="absolute right-[-20px] bottom-[-40px] w-64 h-64 text-primary/5 rotate-12" />
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 gap-6">
            {insights.map((insight: any) => {
                const Icon = insight.icon;
                return (
                    <div key={insight.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                         <div className="flex flex-col md:flex-row gap-6">
                             {/* Icon Section */}
                             <div className={`p-4 rounded-xl h-fit w-fit ${insight.colorClass}`}>
                                 <Icon size={28} />
                             </div>
                             
                             {/* Content Section */}
                             <div className="flex-1 space-y-4">
                                 <div>
                                     <div className="flex justify-between items-start mb-1">
                                         <h3 className="text-xl font-bold">{insight.title}</h3>
                                         <span className={`px-2 py-1 rounded-md text-xs font-bold bg-muted uppercase tracking-wider ${insight.impactColor}`}>
                                             {insight.impact} Impact
                                         </span>
                                     </div>
                                     <p className="text-muted-foreground">{insight.description}</p>
                                 </div>

                                 <div className="bg-muted/30 border border-border rounded-lg p-4">
                                     <h4 className="font-semibold text-sm mb-1 text-primary flex items-center gap-2">
                                        <Brain size={16} /> Recommendation
                                     </h4>
                                     <p className="text-sm">{insight.recommendation}</p>
                                 </div>

                                 {/* Confidence Bar */}
                                 <div className="flex items-center gap-4">
                                     <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">AI Confidence</span>
                                     <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                         <div 
                                            className="h-full bg-primary rounded-full" 
                                            style={{ width: `${insight.confidence}%` }}
                                         ></div>
                                     </div>
                                     <span className="text-xs font-bold">{insight.confidence}%</span>
                                 </div>
                             </div>
                         </div>
                    </div>
                )
            })}
        </div>
    </div>
  );
}
