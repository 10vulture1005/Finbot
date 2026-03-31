"use client";

import { triggerRebalance, addStock, deleteAllStocks, PortfolioStock } from "@/app/services/portfolioService";
import { usePortfolio } from "@/app/context/PortfolioContext";
import { analyzePortfolio, executeRebalance } from "@/app/services/quantService";
import React from "react";
import { toast } from "sonner";
// ... (rest of imports)
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Layers,
  PieChart as PieChartIcon,
  ShieldAlert,
  Archive,
  Plus,
  X,
  Brain
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { searchStocks } from "@/app/services/marketService";

const MetricCard = ({ label, value, subtext }: { label: string, value: string, subtext?: string }) => (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <h3 className="text-muted-foreground text-sm font-medium">{label}</h3>
        <div className="text-2xl font-bold mt-1 mb-1">{value}</div>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
);



export default function PortfolioPage() {
  const { portfolio: holdings, user, loading, refreshPortfolio } = usePortfolio();


  console.log(holdings);
  
  const [isRebalancing, setIsRebalancing] = React.useState(false);
  const [rebalanceState, setRebalanceState] = React.useState<any>(null);
  
  // Local state for user/holdings removed in favor of context
  // But some logic might rely on local state setters? 
  // No, we can just use the data from context.
  
  // Add Stock State
  const [isAddStockOpen, setIsAddStockOpen] = React.useState(false);
  const [newStock, setNewStock] = React.useState({ symbol: '', quantity: '', price: '' });
  const [addingStock, setAddingStock] = React.useState(false);

  // Search state
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (newStock.symbol.length > 1 && showSuggestions) {
         try {
           const results = await searchStocks(newStock.symbol);
           setSearchResults(results);
         } catch (e) {
           console.error("Search error", e);
         }
      } else if (newStock.symbol.length === 0) {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newStock.symbol, showSuggestions]);

  const selectStock = (stock: any) => {
    setNewStock({ ...newStock, symbol: stock.symbol });
    setShowSuggestions(false);
  };

  const fetchData = async () => {
    await refreshPortfolio();
  };

  // Removed initial useEffect as context handles it


  const handleRebalance = async (mode: 'dry_run' | 'execute') => {
      if (!user) return;
      setIsRebalancing(true);
      try {
          const result = await triggerRebalance({
             action: 'risk_rebalance',
             mode,
             reason: 'manual'
          });

          if (mode === 'execute') {
             if (result.executed) {
                 setRebalanceState((prev: any) => ({ ...prev, ...result, executed: true, explanation: "Rebalance executed successfully." }));
                 // Refetch to update UI
                 await new Promise(r => setTimeout(r, 1000)); // smooth ux
                 await fetchData();
             } else {
                 setRebalanceState(result);
             }
          } else {
             setRebalanceState(result);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsRebalancing(false);
      }
  };

  const handleDeleteAll = async () => {
      if(!confirm("Are you sure you want to sell/delete ALL your stocks? This cannot be undone.")) return;
      setIsRebalancing(true);
      try {
          await deleteAllStocks();
          await fetchData();
      } catch (e) {
          console.error(e);
          toast.error("Failed to delete all stocks.");
      } finally {
          setIsRebalancing(false);
      }
  };

  // AI State
  const [aiResult, setAiResult] = React.useState<any>(null);

  const runAIAnalysis = async () => {
      setIsRebalancing(true);
      setAiResult(null);
      try {
          const result = await analyzePortfolio();
          if (result.success && result.data) {
               setAiResult(result.data); 
          } else {
               alert("AI Analysis failed: " + (result.message || "Unknown error"));
          }
      } catch (e) {
          console.error(e);
          toast.error("Failed to run AI Analysis");
      } finally {
          setIsRebalancing(false);
      }
  };

  const executeAIRebalance = async () => {
      if (!aiResult) return;
      if (!confirm("This will execute trades based on AI recommendations. Proceed?")) return;
      
      setIsRebalancing(true);
      try {
           let targetWeights = aiResult.weights;
           if (!targetWeights && aiResult.details) {
                 targetWeights = {};
                 aiResult.details.forEach((d: any) => targetWeights[d.symbol] = d.weight);
           }

           const data = await executeRebalance(targetWeights);
           
           if (data.status === 'success') {
               toast.success(`AI Rebalance Executed!\n${data.trades.join('\n')}`);
               setAiResult(null);
               await fetchData();
           } else {
               toast.error("Rebalance Failed: " + data.message);
           }

      } catch (e) {
          console.error(e);
          toast.error("Execution failed");
      } finally {
          setIsRebalancing(false);
      }
  };

  const handleAddStock = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newStock.symbol || !newStock.quantity || !newStock.price) return;
      setAddingStock(true);
      try {
          await addStock({
            symbol: newStock.symbol.toUpperCase(), 
            quantity: parseFloat(newStock.quantity), 
            avg_price: parseFloat(newStock.price)
          });
          setNewStock({ symbol: '', quantity: '', price: '' });
          setIsAddStockOpen(false);
          await fetchData(); // Refresh portfolio
      } catch (error) {
          console.error("Failed to add stock", error);
          toast.error("Failed to add stock. Please check inputs.");
      } finally {
          setAddingStock(false);
      }
  };

  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899'];

  const { totalValue, totalInvestment, totalReturnPct, allocationData, sectorData } = React.useMemo(() => {
      const tValue = (holdings || []).reduce((sum, h) => sum + (h.market_value || (h.quantity * (h.current_price || 0))), 0);
      const tInvest = (holdings || []).reduce((sum, h) => sum + (h.quantity * h.avg_price), 0);
      const tRetPct = tInvest > 0 ? ((tValue - tInvest) / tInvest) * 100 : 0;
      
      // Use actual market value for the dataKey so recharts can size slices correctly
      const allocData = (holdings || []).map((h, i) => ({
          name: h.symbol,
          value: parseFloat((h.market_value || (h.quantity * (h.current_price || 0)) || 0).toFixed(2)),
          percentage: tValue > 0 ? parseFloat(((h.market_value || 0) / tValue * 100).toFixed(1)) : 0,
          color: CHART_COLORS[i % CHART_COLORS.length]
      })).filter(d => d.value > 0).sort((a,b) => b.value - a.value).slice(0, 8);

      const sMap = new Map<string, number>();
      (holdings || []).forEach(h => {
          const s = h.sector || "Unknown";
          const val = h.market_value || (h.quantity * (h.current_price || 0)) || 0;
          sMap.set(s, (sMap.get(s) || 0) + val);
      });
      const sectData = Array.from(sMap.entries()).map(([name, val], i) => ({
          name,
          value: parseFloat(val.toFixed(2)),
          percentage: tValue > 0 ? parseFloat((val / tValue * 100).toFixed(1)) : 0,
          color: CHART_COLORS[(i + 2) % CHART_COLORS.length]
      })).filter(d => d.value > 0);

      return { totalValue: tValue, totalInvestment: tInvest, totalReturnPct: tRetPct, allocationData: allocData, sectorData: sectData };
  }, [holdings]);

  // Performers
  const sortedByPerf = [...(holdings || [])].sort((a, b) => (b.daily_return || 0) - (a.daily_return || 0));
  const bestPerformers = sortedByPerf.slice(0, 3).map(h => ({
      symbol: h.symbol,
      name: h.symbol, // name missing in API currently
      return: `${((h.daily_return || 0) * 100).toFixed(2)}%`,
      price: `$${(h.current_price || 0).toFixed(2)}`
  }));
  const worstPerformers = sortedByPerf.slice(-3).reverse().map(h => ({
      symbol: h.symbol,
      name: h.symbol,
      return: `${((h.daily_return || 0) * 100).toFixed(2)}%`,
      price: `$${(h.current_price || 0).toFixed(2)}`
  }));
  
  // Risky Stocks (High Risk Contribution)
  const riskyStocks = (holdings || [])
      .filter(h => (h.risk_contribution || 0) > 0.20) // Arbitrary threshold for display
      .map(h => ({
          symbol: h.symbol,
          reason: "High Risk Contribution",
          riskLevel: "High"
      }));

  if (loading) return <div className="p-8">Loading portfolio...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Portfolio Analysis</h1>
                <p className="text-muted-foreground">{!holdings || holdings.length === 0 ? "Your portfolio is empty. Add stocks to see analysis." : "Real-time risk and performance analysis."}</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsAddStockOpen(true)}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors flex items-center gap-2">
                    <Plus size={18} />
                    Add Stock
                </button>
                <button 
                    onClick={() => handleRebalance('dry_run')}
                    disabled={isRebalancing}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {isRebalancing ? 'Checking...' : 'Check Balance'}
                </button>
                <button 
                    onClick={handleDeleteAll}
                    disabled={isRebalancing || !holdings || holdings.length === 0}
                    className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50">
                    Sell All
                </button>
                {/* AI Rebalance Button */}
                 <button 
                    onClick={runAIAnalysis}
                    disabled={isRebalancing}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2">
                    <Brain size={18} />
                    {isRebalancing ? 'Analyzing...' : 'AI Optimize'}
                </button>

                {rebalanceState?.drift_detected && (
                     <button 
                        onClick={() => handleRebalance('execute')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                        Execute Rebalance
                    </button>
                )}
            </div>
        </div>

        {/* AI Result Panel Moved to Modal */}

        {/* Rebalance Explanation Panel */}
        {rebalanceState && (
            <div className={`p-4 rounded-xl border ${rebalanceState.drift_detected ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                <div className="flex items-start gap-3">
                    {rebalanceState.drift_detected ? <AlertTriangle className="text-red-500 mt-1" /> : <ShieldAlert className="text-green-600 mt-1" />}
                    <div className="w-full">
                        <h3 className="font-semibold text-lg">{rebalanceState.drift_detected ? "Rebalance Recommended" : "Portfolio Balanced"}</h3>
                        <p className="text-muted-foreground mt-1 mb-4">{rebalanceState.explanation}</p>
                        
                        {rebalanceState.validation && (
                            <div className="mt-2 mb-4 grid grid-cols-2 gap-4 bg-background/50 rounded-lg p-3 border border-border/50">
                                <div>
                                    <p className="text-xs text-muted-foreground">Expected Volatility</p>
                                    <p className="text-sm font-semibold">
                                        <span className="line-through text-muted-foreground mr-2">{(rebalanceState.validation.volatility_before * 100).toFixed(1)}%</span>
                                        <span className="text-green-500">{(rebalanceState.validation.volatility_after * 100).toFixed(1)}%</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Max Drawdown</p>
                                    <p className="text-sm font-semibold">
                                        <span className="line-through text-muted-foreground mr-2">{(rebalanceState.validation.max_drawdown_before * 100).toFixed(1)}%</span>
                                        <span className="text-green-500">{(rebalanceState.validation.max_drawdown_after * 100).toFixed(1)}%</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                                    <p className="text-sm font-semibold">
                                        <span className="line-through text-muted-foreground mr-2">{rebalanceState.validation.sharpe_before.toFixed(2)}</span>
                                        <span className="text-green-500">{rebalanceState.validation.sharpe_after.toFixed(2)}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Turnover & Cost</p>
                                    <p className="text-sm font-semibold">
                                        {(rebalanceState.turnover_pct * 100).toFixed(1)}% / ${rebalanceState.costs?.estimated_brokerage_plus_slippage.toFixed(2) || '0.00'}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {(rebalanceState.new_weights || rebalanceState.current_weights) && (
                            <div className="mt-4 bg-background/50 rounded-lg p-4 border border-border/50">
                                <h4 className="font-medium text-sm mb-3">Holdings Breakdown</h4>
                                <div className="space-y-2">
                                    {Object.entries(
                                        (rebalanceState.new_weights && Object.keys(rebalanceState.new_weights).length > 0) 
                                        ? rebalanceState.new_weights 
                                        : (rebalanceState.current_weights || {})
                                    ).map(([symbol, weight]: [string, any]) => {
                                        const currentWeight = rebalanceState.current_weights ? rebalanceState.current_weights[symbol] || 0 : 0;
                                        // If using current_weights as fallback, target is same as current 
                                        const targetWeight = (rebalanceState.new_weights && Object.keys(rebalanceState.new_weights).length > 0) ? weight : currentWeight;
                                        const diff = targetWeight - currentWeight;
                                        return (
                                            <div key={symbol} className="flex justify-between items-center text-sm py-1 border-b border-border/50 last:border-0">
                                                <span className="font-medium">{symbol}</span>
                                                <div className="flex gap-6">
                                                    <span className="text-muted-foreground w-24 text-right">Current: {(currentWeight * 100).toFixed(1)}%</span>
                                                    <span className="font-medium w-24 text-right">Target: {(targetWeight * 100).toFixed(1)}%</span>
                                                    {Math.abs(diff) > 0.001 && (
                                                        <span className={`w-16 text-right ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                                                        </span>
                                                    )}
                                                    {Math.abs(diff) <= 0.001 && <span className="w-16"></span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {rebalanceState.executed && <p className="text-green-600 font-bold mt-4">✓ Rebalance Executed Successfully</p>}
                    </div>
                </div>
            </div>
        )}

        {/* Top Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             <MetricCard label="Total Investment" value={`$${totalInvestment.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
             <MetricCard label="Current Value" value={`$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`} subtext={`${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(2)}% All time`} />
             <MetricCard 
                label="Volatility" 
                value={rebalanceState ? `${(rebalanceState.vol_before * 100).toFixed(1)}%` : `${((user?.target_volatility || 0.14) * 100).toFixed(1)}%`} 
                subtext={rebalanceState ? `Target: ${(user?.target_volatility || 0.10) * 100}%` : "Annualized Std Dev"} 
             />
             {/* <MetricCard label="Sharpe Ratio" value="-" subtext="Not available" /> */}
        </div>

        {/* Allocation Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Allocation */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                    <PieChartIcon size={20} className="text-muted-foreground" />
                    Asset Allocation
                </h3>
                <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                         <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                         >
                            {allocationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                            ))}
                         </Pie>
                         <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--color-popover)', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            formatter={(value: any, name: any, props: any) => [
                                `₹${Number(value).toLocaleString()} (${props.payload.percentage}%)`,
                                name
                            ]}
                         />
                         <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            iconType="circle"
                            formatter={(value: any, entry: any) => <span className="text-sm text-foreground ml-1 mr-4">{value} ({entry.payload.percentage}%)</span>}
                         />
                     </PieChart>
                 </ResponsiveContainer>
                </div>
            </div>

            {/* Sector Allocation */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                    <Layers size={20} className="text-muted-foreground" />
                    Sector Diversification
                </h3>
                <div className="h-[250px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={sectorData} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                            <XAxis 
                                type="number" 
                                axisLine={false} 
                                tickLine={false}
                                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                                tickFormatter={(v) => `${v}%`}
                            />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false}
                                width={110}
                                tick={{ fill: 'var(--color-foreground)', fontSize: 12, fontWeight: 500 }} 
                            />
                            <Tooltip
                                cursor={{fill: 'var(--color-muted)', opacity: 0.2}}
                                contentStyle={{ backgroundColor: 'var(--color-popover)', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                formatter={(value: any, name: any, props: any) => [`${props.payload.percentage}% (₹${Number(value).toLocaleString()})`, 'Allocation']}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                                {sectorData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                         </BarChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Analysis & Performers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Fundamentals & Sentiment (Hidden until backend support) */}
            {/* <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-6">
                 ...
            </div> */}

            {/* Top/Worst Performers */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-muted-foreground" />
                    Top Performers
                </h3>
                <div className="space-y-4 mb-8">
                    {bestPerformers.map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                                    {stock.symbol[0]}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{stock.symbol}</p>
                                    <p className="text-xs text-muted-foreground">{stock.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600 text-sm">{stock.return}</p>
                                <p className="text-xs text-muted-foreground">{stock.price}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <TrendingDown size={20} className="text-muted-foreground" />
                    Underperformers
                </h3>
                <div className="space-y-4">
                    {worstPerformers.map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">
                                    {stock.symbol[0]}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{stock.symbol}</p>
                                    <p className="text-xs text-muted-foreground">{stock.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-red-600 text-sm">{stock.return}</p>
                                <p className="text-xs text-muted-foreground">{stock.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

             {/* Risk Radar */}
             <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-muted-foreground" />
                    Risk Analysis
                </h3>
                {rebalanceState ? (
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg mb-6">
                        <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-1">Current Volatility: {(rebalanceState.vol_before * 100).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Target: {(user?.target_volatility || 0.10) * 100}%</p>
                    </div>
                ) : (
                    <div className="p-4 bg-muted/50 border border-border rounded-lg mb-6">
                         <p className="text-sm text-muted-foreground">Run "Check Balance" to analyze portfolio risk.</p>
                    </div>
                )}
                
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">High Risk Holdings</h4>
                <div className="space-y-3">
                    {riskyStocks.map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                             <div className="flex items-center gap-3">
                                <AlertTriangle size={16} className="text-orange-500" />
                                <div>
                                    <p className="font-bold text-sm">{stock.symbol}</p>
                                    <p className="text-xs text-muted-foreground">{stock.reason}</p>
                                </div>
                             </div>
                             <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded">
                                 {stock.riskLevel}
                             </span>
                        </div>
                    ))}
                </div>
             </div>

        </div>


        {/* Add Stock Modal */}
        {isAddStockOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                    <button 
                        onClick={() => setIsAddStockOpen(false)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                    >
                        <X size={20} />
                    </button>
                    
                    <h2 className="text-xl font-bold mb-4">Add New Position</h2>
                    
                    <form onSubmit={handleAddStock} className="space-y-4">
                        {/* ... existing form fields ... */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Symbol</label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={newStock.symbol}
                                    onChange={(e) => {
                                        setNewStock({...newStock, symbol: e.target.value.toUpperCase()});
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="e.g. RELIANCE"
                                    className="w-full p-2 rounded-md border border-input bg-background"
                                    required 
                                />
                                {showSuggestions && searchResults.length > 0 && (
                                    <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-xl border border-border bg-popover text-popover-foreground">
                                        {searchResults.map((stock) => (
                                            <li
                                                key={stock.symbol}
                                                className="px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/50 last:border-0"
                                                onClick={() => selectStock(stock)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold">{stock.symbol}</span>
                                                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{stock.exchange}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Quantity</label>
                                <input 
                                    type="number"
                                    step="any"
                                    value={newStock.quantity}
                                    onChange={(e) => setNewStock({...newStock, quantity: e.target.value})}
                                    placeholder="0"
                                    className="w-full p-2 rounded-md border border-input bg-background"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Avg Price</label>
                                <input 
                                    type="number"
                                    step="any"
                                    value={newStock.price}
                                    onChange={(e) => setNewStock({...newStock, price: e.target.value})}
                                    placeholder="0.00"
                                    className="w-full p-2 rounded-md border border-input bg-background"
                                    required 
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                type="button"
                                onClick={() => setIsAddStockOpen(false)}
                                className="px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={addingStock}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {addingStock ? 'Adding...' : 'Add Position'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* AI Rebalance Modal */}
        {(isRebalancing || aiResult) && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                 <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl p-6 relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                     <button 
                         onClick={() => { setIsRebalancing(false); setAiResult(null); }}
                         className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                     >
                         <X size={20} />
                     </button>

                     <div className="mb-6">
                         <h2 className="text-2xl font-bold flex items-center gap-2">
                             <Brain className="text-purple-500" /> AI Portfolio Rebalancing
                         </h2>
                         <p className="text-muted-foreground">Optimize your holdings based on current market regime.</p>
                     </div>

                     {isRebalancing && !aiResult ? (
                         <div className="flex flex-col items-center justify-center py-12 flex-1">
                             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                             <p className="text-lg font-medium">Analyzing market conditions...</p>
                             <p className="text-sm text-muted-foreground">Running {user?.risk_model_version || 'MVO'} Model</p>
                         </div>
                     ) : aiResult ? (
                         <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                             
                             {/* Analysis Summary */}
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                                     <span className="text-xs text-muted-foreground uppercase">Market Regime</span>
                                     <div className="text-lg font-bold">{aiResult.regime || "Normal"}</div>
                                 </div>
                                 <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                                     <span className="text-xs text-muted-foreground uppercase">Exp. Return</span>
                                     <div className="text-lg font-bold text-green-500">{(aiResult.portfolio_expected_return * 100).toFixed(1)}%</div>
                                 </div>
                             </div>

                             {/* Proposed Changes Table */}
                             <div>
                                 <h3 className="font-semibold mb-3">Proposed Allocation</h3>
                                 <div className="border border-border rounded-lg overflow-hidden">
                                     <table className="w-full text-sm">
                                         <thead className="bg-muted/50">
                                             <tr>
                                                 <th className="text-left p-3 font-medium">Asset</th>
                                                 <th className="text-right p-3 font-medium">Current</th>
                                                 <th className="text-right p-3 font-medium">Target</th>
                                                 <th className="text-right p-3 font-medium">Action</th>
                                             </tr>
                                         </thead>
                                         <tbody>
                                             {aiResult.details?.map((item: any) => {
                                                 const diff = item.weight - (item.current_weight || 0);
                                                 return (
                                                     <tr key={item.symbol} className="border-t border-border/50">
                                                         <td className="p-3 font-medium">{item.symbol}</td>
                                                         <td className="p-3 text-right">{((item.current_weight || 0) * 100).toFixed(1)}%</td>
                                                         <td className="p-3 text-right font-bold text-purple-400">{(item.weight * 100).toFixed(1)}%</td>
                                                         <td className="p-3 text-right">
                                                             {diff > 0.01 ? (
                                                                 <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs">+{(diff * 100).toFixed(1)}% BUY</span>
                                                             ) : diff < -0.01 ? (
                                                                 <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs">{(diff * 100).toFixed(1)}% SELL</span>
                                                             ) : (
                                                                 <span className="text-muted-foreground text-xs">HOLD</span>
                                                             )}
                                                         </td>
                                                     </tr>
                                                 )
                                             })}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>

                             {/* Explanation from AI */}
                             {aiResult.explanation && (
                                 <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/10">
                                     <h4 className="font-semibold text-purple-400 mb-1 flex items-center gap-2">
                                         <Brain size={14} /> AI Reasoning
                                     </h4>
                                     <p className="text-sm text-foreground/80 leading-relaxed">{aiResult.explanation}</p>
                                 </div>
                             )}

                             {/* Action Buttons */}
                             <div className="pt-4 flex gap-3">
                                 <button 
                                     onClick={() => { setIsRebalancing(false); setAiResult(null); }}
                                     className="flex-1 py-3 hover:bg-muted rounded-lg transition-colors font-medium"
                                 >
                                     Cancel
                                 </button>
                                 <button 
                                     onClick={executeAIRebalance}
                                     className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20 transition-all"
                                 >
                                     Confirm & Rebalance
                                 </button>
                             </div>

                         </div>
                     ) : null}
                 </div>
             </div>
        )}

    </div>
  );
}
