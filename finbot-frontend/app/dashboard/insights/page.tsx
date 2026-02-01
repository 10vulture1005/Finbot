"use client";

import React from "react";
import { Brain, AlertTriangle, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";

// Mock Data
const insights = [
    {
        id: 1,
        type: "risk",
        title: "High Exposure to Technology",
        description: "Your portfolio has 45% allocation in Technology (NVDA, MSFT). This concentration increases risk during sector-specific downturns.",
        recommendation: "Consider reducing exposure by reallocating 10% to defensive sectors like Healthcare or FMCG.",
        confidence: 92,
        impact: "High",
        impactColor: "text-red-500",
        icon: AlertTriangle,
        colorClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900",
    },
    {
        id: 2,
        type: "rebalance",
        title: "Large Cap Dominance",
        description: "90% of your holdings are in Large Cap stocks. While stable, this might limit potential growth compared to Mid Caps.",
        recommendation: "Consider creating a small bucket for quality Mid Cap stocks with strong fundamentals.",
        confidence: 85,
        impact: "Medium",
        impactColor: "text-yellow-600",
        icon: TrendingUp,
        colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900",
    },
    {
        id: 3,
        type: "health",
        title: "Strong Portfolio Health",
        description: "Your portfolio's Sharpe ratio is 1.85, indicating excellent risk-adjusted returns compared to the benchmark.",
        recommendation: "Maintain current strategy. No urgent actions needed.",
        confidence: 98,
        impact: "Nuetral",
        impactColor: "text-green-600",
        icon: ShieldCheck,
        colorClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900",
    },
];

export default function InsightsPage() {
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
                <h2 className="text-2xl font-bold mb-2">3 New Insights Generated</h2>
                <p className="text-muted-foreground mb-6">Our AI has analyzed your recent transactions and sector performance updates.</p>
                <div className="flex gap-4 text-sm font-medium">
                    <div className="px-3 py-1 bg-background/50 rounded-full border border-border backdrop-blur-sm">
                        Confidence Score: <span className="text-primary">92%</span>
                    </div>
                </div>
            </div>
             <Brain className="absolute right-[-20px] bottom-[-40px] w-64 h-64 text-primary/5 rotate-12" />
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 gap-6">
            {insights.map((insight) => {
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

                             {/* Action Button */}
                             <div className="flex md:flex-col justify-end">
                                 <button className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                                     <ArrowRight size={24} />
                                 </button>
                             </div>
                         </div>
                    </div>
                )
            })}
        </div>

    </div>
  );
}
