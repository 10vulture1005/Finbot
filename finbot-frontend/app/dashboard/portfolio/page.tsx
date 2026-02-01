"use client";

import { getCurrentUser, getPortfolio, triggerRebalance, addStock, UserPortfolioData, PortfolioStock } from "@/app/services/portfolioService";
import React from "react";
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
  X
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

// Mock Data
// Constants removed. All data derived from API.

const MetricCard = ({ label, value, subtext }: { label: string, value: string, subtext?: string }) => (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <h3 className="text-muted-foreground text-sm font-medium">{label}</h3>
        <div className="text-2xl font-bold mt-1 mb-1">{value}</div>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
);

export default function PortfolioPage() {
  const [isRebalancing, setIsRebalancing] = React.useState(false);
  const [rebalanceState, setRebalanceState] = React.useState<any>(null);
  const [user, setUser] = React.useState<UserPortfolioData | null>(null);
  const [holdings, setHoldings] = React.useState<PortfolioStock[]>([]);
  const [loading, setLoading] = React.useState(true);

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
    try {
        const u = await getCurrentUser();
        setUser(u);
        const p = await getPortfolio(u.id);
        setHoldings(p);
    } catch (e) {
        console.error("Failed to fetch portfolio data", e);
    } finally {
        setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleRebalance = async (mode: 'dry_run' | 'execute') => {
      if (!user) return;
      setIsRebalancing(true);
      try {
          const result = await triggerRebalance(user.id, {
             action: 'rebalance',
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

  const handleAddStock = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newStock.symbol || !newStock.quantity || !newStock.price) return;
      setAddingStock(true);
      try {
          await addStock(newStock.symbol.toUpperCase(), parseFloat(newStock.quantity), parseFloat(newStock.price));
          setNewStock({ symbol: '', quantity: '', price: '' });
          setIsAddStockOpen(false);
          await fetchData(); // Refresh portfolio
      } catch (error) {
          console.error("Failed to add stock", error);
          alert("Failed to add stock. Please check inputs.");
      } finally {
          setAddingStock(false);
      }
  };

  // Derived Data
  const totalValue = holdings.reduce((sum, h) => sum + (h.market_value || (h.quantity * (h.current_price || 0))), 0);
  const totalInvestment = holdings.reduce((sum, h) => sum + (h.quantity * h.avg_price), 0);
  const totalReturnPct = totalInvestment > 0 ? ((totalValue - totalInvestment) / totalInvestment) * 100 : 0;
  
  // Asset Allocation (by Symbol for now as Asset Class data missing)
  const allocationData = holdings.map((h, i) => ({
      name: h.symbol,
      value: totalValue > 0 ? parseFloat(((h.market_value || 0) / totalValue * 100).toFixed(1)) : 0,
      color: `var(--color-chart-${(i % 5) + 1})`
  })).sort((a,b) => b.value - a.value).slice(0, 5); // Top 5
  
  // Sector Allocation (group by sector)
  const sectorMap = new Map<string, number>();
  holdings.forEach(h => {
      const s = h.sector || "Unknown";
      const val = h.market_value || 0;
      sectorMap.set(s, (sectorMap.get(s) || 0) + val);
  });
  const sectorData = Array.from(sectorMap.entries()).map(([name, val], i) => ({
      name,
      value: totalValue > 0 ? parseFloat((val / totalValue * 100).toFixed(1)) : 0,
      color: `var(--color-chart-${(i % 5) + 1})`
  }));

  // Performers
  const sortedByPerf = [...holdings].sort((a, b) => (b.daily_return || 0) - (a.daily_return || 0));
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
  const riskyStocks = holdings
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
                <p className="text-muted-foreground">{holdings.length === 0 ? "Your portfolio is empty. Add stocks to see analysis." : "Real-time risk and performance analysis."}</p>
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
                {rebalanceState?.drift_detected && (
                     <button 
                        onClick={() => handleRebalance('execute')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                        Execute Rebalance
                    </button>
                )}
            </div>
        </div>

        {/* Rebalance Explanation Panel */}
        {rebalanceState && (
            <div className={`p-4 rounded-xl border ${rebalanceState.drift_detected ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                <div className="flex items-start gap-3">
                    {rebalanceState.drift_detected ? <AlertTriangle className="text-red-500 mt-1" /> : <ShieldAlert className="text-green-600 mt-1" />}
                    <div>
                        <h3 className="font-semibold text-lg">{rebalanceState.drift_detected ? "Rebalance Recommended" : "Portfolio Balanced"}</h3>
                        <p className="text-muted-foreground mt-1">{rebalanceState.explanation}</p>
                        {rebalanceState.executed && <p className="text-green-600 font-bold mt-2">✓ Rebalance Executed Successfully</p>}
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
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                             >
                                {allocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                             </Pie>
                             <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--color-popover)', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                             />
                             <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                formatter={(value: any, entry: any) => <span className="text-sm text-foreground ml-1 mr-4">{value} ({entry.payload.value}%)</span>}
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
                         <BarChart data={sectorData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false}
                                width={100}
                                tick={{ fill: 'var(--color-foreground)', fontSize: 13, fontWeight: 500 }} 
                            />
                            <Tooltip
                                cursor={{fill: 'var(--color-muted)', opacity: 0.2}}
                                contentStyle={{ backgroundColor: 'var(--color-popover)', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
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

    </div>
  );
}
