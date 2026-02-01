"use client";

import React from "react";
import {
  MoreVertical,
  Search,
  Filter,
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart2
} from "lucide-react";
import Link from "next/link";

import { getPortfolio, getCurrentUser, PortfolioStock } from "@/app/services/portfolioService";
import { getStockQuote, StockQuote } from "@/app/services/marketService";

export default function HoldingsPage() {
  const [holdings, setHoldings] = React.useState<PortfolioStock[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = async () => {
    try {
        const u = await getCurrentUser();
        // Assuming getPortfolio uses the user ID from the token or we pass u.id if needed.
        // Based on service definition: const getPortfolio = async (user_id?: number)
        const data = await getPortfolio(u.id);
        
        // Fetch real-time quotes
        const updatedHoldings = await Promise.all(data.map(async (stock) => {
             const quote = await getStockQuote(stock.symbol);
             if (quote.price > 0) {
                 return {
                     ...stock,
                     current_price: quote.price,
                     daily_return: quote.changePercent / 100 // assuming api returns percentage like 0.5 for 0.5%
                 };
             }
             return stock;
        }));
        
        setHoldings(updatedHoldings);
    } catch (error) {
        console.error("Failed to fetch holdings", error);
    } finally {
        setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Holdings</h1>
          <p className="text-muted-foreground">Manage and analyze your current stock positions.</p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted transition">
               <Download size={16} />
               Export CSV
           </button>
           <Link href="/dashboard/add-stock">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition">
                + Add Stock
            </button>
           </Link>
        </div>
      </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search stocks..." 
                    className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>
             <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted transition">
               <Filter size={16} />
               Filters
           </button>
        </div>

      {/* Holdings Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Stock Name</th>
                <th className="px-6 py-4 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-6 py-4 text-right font-medium text-muted-foreground">Avg Price</th>
                <th className="px-6 py-4 text-right font-medium text-muted-foreground">Current</th>
                <th className="px-6 py-4 text-right font-medium text-muted-foreground">Invested</th>
                <th className="px-6 py-4 text-right font-medium text-muted-foreground">Current Val</th>
                <th className="px-6 py-4 text-right font-medium text-muted-foreground">P&L</th>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Risk Profile</th>
                <th className="px-6 py-4 text-center font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                  <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                          Loading holdings...
                      </td>
                  </tr>
              ) : holdings.length === 0 ? (
                  <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                          No holdings found. Add some stocks to get started.
                      </td>
                  </tr>
              ) : (
                  holdings.map((stock) => {
                    const invested = stock.quantity * stock.avg_price;
                    const currentValue = stock.market_value || (stock.quantity * (stock.current_price || 0));
                    const pnl = currentValue - invested;
                    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
                    
                    // Derived UI helpers
                    const letter = stock.symbol[0];
                    const riskHigh = (stock.risk_contribution || 0) > 0.2;
                    const riskLabel = riskHigh ? "High" : "Normal"; // Simplified
                    
                    return (
                        <tr key={stock.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary`}>
                                    {letter}
                                </div>
                                <div>
                                    <p className="font-semibold">{stock.symbol}</p>
                                    <p className="text-xs text-muted-foreground">{stock.sector || "Stock"}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{stock.quantity}</td>
                        <td className="px-6 py-4 text-right">₹{stock.avg_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right font-medium">₹{(stock.current_price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right text-muted-foreground">₹{invested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right font-medium">₹{currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right">
                            <div className={`font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-xs ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${
                                    riskHigh ? 'bg-red-500' : 'bg-green-500' 
                                }`}></span>
                                <span>{riskLabel}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <button className="p-2 hover:bg-emerald-500/10 hover:text-emerald-500 rounded-md transition-colors" title="Buy More">
                                    <span className="text-xs font-bold">Buy</span>
                                </button>
                                <button className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-md transition-colors" title="Sell">
                                    <span className="text-xs font-bold">Sell</span>
                                </button>
                                <Link href={`/dashboard/analysis`} className="p-2 hover:bg-primary/10 hover:text-primary rounded-md transition-colors" title="Analyze">
                                    <BarChart2 size={16} />
                                </Link>
                            </div>
                        </td>
                        </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
