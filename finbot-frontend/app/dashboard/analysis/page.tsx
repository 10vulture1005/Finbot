"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Activity, TrendingUp, TrendingDown, Layers, Zap, AlertTriangle, FileText, ExternalLink, Gauge, Users, PieChart as PieChartIcon, LineChart as LineChartIcon } from "lucide-react";
import api from '@/app/services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AnalysisPage() {
  const [searchInput, setSearchInput] = useState("RELIANCE.NS");
  const [activeSymbol, setActiveSymbol] = useState("RELIANCE.NS");
  const [indicators, setIndicators] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [analystView, setAnalystView] = useState<any[]>([]);
  const [riskMeter, setRiskMeter] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // New State for Portfolio Analytics
  const [activeTab, setActiveTab] = useState<"single" | "portfolio">("single");
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const fetchPortfolioAnalytics = async () => {
      setLoadingPortfolio(true);
      try {
          const res = await api.get('/portfolio/analytics');
          if (res.success && res.data) {
              setPortfolioData(res.data);
          }
      } catch (err) {
          console.error("Failed to fetch portfolio analytics:", err);
      } finally {
          setLoadingPortfolio(false);
      }
  };

  useEffect(() => {
      if (activeTab === "portfolio" && !portfolioData) {
          fetchPortfolioAnalytics();
      }
  }, [activeTab]);

  // Fetch Quant Indicators
  const fetchIndicators = async (sym: string) => {
      setLoading(true);
      try {
          // ensure no prefix duplicates. API base is already /api/v1
          const res = await api.get(`/quant/indicators/${sym}`);
          if (res.success && res.data) {
              setIndicators(res.data);
          } else {
              setIndicators(null);
          }
      } catch (err) {
          console.error(err);
          setIndicators(null);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchIndicators(activeSymbol);
      fetchNews(activeSymbol);
  }, [activeSymbol]);

  // Fetch News from Backend
  const fetchNews = async (sym: string) => {
      setLoadingNews(true);
      try {
          // Remove suffix if present (or rely on backend to strip it)
          const res = await api.get(`/market/news/${sym}`);
          if (res.success && res.data) {
              const resData = res.data as any;
              setNews((resData.news as any[]) || []);
              setAnalystView((resData.analystView as any[]) || []);
              setRiskMeter(resData.riskMeter || null);
          } else {
              setNews([]);
              setAnalystView([]);
              setRiskMeter(null);
          }
      } catch (err) {
          console.error("Failed to fetch news and data:", err);
          setNews([]);
          setAnalystView([]);
          setRiskMeter(null);
      } finally {
          setLoadingNews(false);
      }
  };

  // TradingView Widget Embed Logic
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // TradingView needs exchanges like BSE:RELIANCE or NASDAQ:AAPL
    // We'll pass the raw symbol and let TV resolve it, or default to generic
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": activeSymbol.replace('.NS', ''), // Basic formatting for TV
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": false, 
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });
    
    containerRef.current.appendChild(script);

  }, [activeSymbol]); 

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if(searchInput.trim()) {
          setActiveSymbol(searchInput.trim().toUpperCase());
      }
  }

  // Helper renderers
  const getRsiColor = (rsi: number) => {
      if (!rsi) return "bg-gray-500";
      if (rsi >= 70) return "bg-red-500";
      if (rsi <= 30) return "bg-green-500";
      return "bg-blue-500";
  }
  
  const getMacdSignal = (macd: number, sig: number) => {
      if (!macd || !sig) return { text: "Neutral", color: "text-gray-400" };
      return macd > sig ? { text: "Bullish", color: "text-green-400" } : { text: "Bearish", color: "text-red-400" };
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* Header & Search */}
      <div className="flex justify-between items-center bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl shadow-lg shrink-0">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Activity className="text-indigo-400" size={24} />
              </div>
              <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">Technical Analysis</h1>
                  <p className="text-sm text-slate-400">Advanced Charting & Finbot Quant Analytics</p>
              </div>
          </div>
           <form onSubmit={handleSearch} className="relative w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                    type="text" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                    placeholder="Search Symbol (e.g. RELIANCE.NS)" 
                    className="w-full pl-9 pr-4 py-2 bg-[#1e293b] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono transition-all"
                />
                <button type="submit" className="absolute right-2 top-1.5 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white transition-colors">
                    Analyze
                </button>
           </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800 shrink-0">
          <button 
              onClick={() => setActiveTab("single")}
              className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === "single" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
          >
              <Activity size={16} />
              Single Stock Analysis
          </button>
          <button 
              onClick={() => setActiveTab("portfolio")}
              className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === "portfolio" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
          >
              <PieChartIcon size={16} />
              Portfolio Analytics
          </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "single" ? (
          <div className="flex-1 flex gap-4 min-h-0">
          {/* TradingView Widget Container (Left) */}
          <div className="flex-[2] bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-lg overflow-hidden relative">
              <div className="absolute inset-0" id="tradingview_widget_container">
                   <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
                        <div className="tradingview-widget-container__widget h-full w-full"></div>
                   </div>
              </div>
          </div>

          {/* Finbot Quant Analytics (Right) */}
          <div className="flex-[1] bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-lg p-5 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                      <Zap className="text-yellow-400" size={20} />
                      <h2 className="text-lg font-bold text-white">Quant Indicators</h2>
                  </div>
                  {loading && <div className="text-xs text-indigo-400 animate-pulse font-mono">CALCULATING...</div>}
              </div>

              {!indicators && !loading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
                      <AlertTriangle size={32} className="opacity-50" />
                      <p className="text-sm">No quant data available for {activeSymbol}</p>
                  </div>
              )}

              {indicators && !loading && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      
                      {/* Price & Trend Status */}
                      <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50">
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Latest Close</p>
                          <div className="text-3xl font-bold text-white mb-4">
                              ₹{indicators.close?.toFixed(2) || '---'}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <p className="text-xs text-slate-400 mb-1">EMA 50</p>
                                  <p className="font-mono text-sm text-indigo-300">{indicators.ema_50?.toFixed(2) || '-'}</p>
                              </div>
                              <div>
                                  <p className="text-xs text-slate-400 mb-1">EMA 200</p>
                                  <p className="font-mono text-sm text-indigo-300">{indicators.ema_200?.toFixed(2) || '-'}</p>
                              </div>
                          </div>
                          <div className="mt-3 text-xs bg-slate-800 p-2 rounded text-slate-300 flex items-center gap-2">
                             {indicators.close > indicators.ema_50 ? <TrendingUp size={14} className="text-green-400"/> : <TrendingDown size={14} className="text-red-400"/>}
                             {indicators.close > indicators.ema_50 ? 'Trading above 50-day moving average' : 'Trading below 50-day moving average'}
                          </div>
                      </div>

                      {/* RSI Gauge */}
                      <div>
                          <div className="flex justify-between items-end mb-2">
                              <h3 className="text-sm font-semibold text-slate-200">Relative Strength (RSI)</h3>
                              <span className={`font-mono font-bold ${indicators.rsi >= 70 ? 'text-red-400' : indicators.rsi <= 30 ? 'text-green-400' : 'text-slate-300'}`}>
                                  {indicators.rsi?.toFixed(1) || '-'}
                              </span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                              <div className="absolute left-[30%] top-0 bottom-0 w-px bg-slate-600 z-10"></div>
                              <div className="absolute left-[70%] top-0 bottom-0 w-px bg-slate-600 z-10"></div>
                              <div 
                                  className={`h-full transition-all duration-1000 ${getRsiColor(indicators.rsi)}`}
                                  style={{ width: `${Math.min(100, Math.max(0, indicators.rsi || 0))}%` }}
                              />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1 uppercase font-bold">
                              <span>Oversold</span>
                              <span>Neutral</span>
                              <span>Overbought</span>
                          </div>
                      </div>

                      {/* MACD */}
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                          <div className="flex justify-between items-center mb-3">
                              <h3 className="text-sm font-semibold text-slate-200">MACD (12, 26, 9)</h3>
                              <span className={`text-xs px-2 py-1 rounded font-bold ${getMacdSignal(indicators.macd, indicators.macd_signal).color} bg-[#0f172a]`}>
                                  {getMacdSignal(indicators.macd, indicators.macd_signal).text}
                              </span>
                          </div>
                          <div className="flex gap-4">
                              <div>
                                  <p className="text-[10px] text-slate-400 uppercase">MACD</p>
                                  <p className="font-mono text-sm text-white">{indicators.macd?.toFixed(2) || '-'}</p>
                              </div>
                              <div>
                                  <p className="text-[10px] text-slate-400 uppercase">Signal</p>
                                  <p className="font-mono text-sm text-white">{indicators.macd_signal?.toFixed(2) || '-'}</p>
                              </div>
                              <div>
                                  <p className="text-[10px] text-slate-400 uppercase">Histogram</p>
                                  <p className={`font-mono text-sm ${indicators.macd > indicators.macd_signal ? 'text-green-400' : 'text-red-400'}`}>
                                      {((indicators.macd || 0) - (indicators.macd_signal || 0)).toFixed(2)}
                                  </p>
                              </div>
                          </div>
                      </div>

                      {/* Volatility & Momentum */}
                      <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#1e293b] p-3 rounded-xl border border-slate-700/50">
                              <p className="text-[10px] text-slate-400 uppercase mb-1 flex items-center gap-1">
                                  <Layers size={12}/> Volatility (20d)
                              </p>
                              <p className="text-lg font-bold text-slate-200">
                                  {indicators.vol_20d ? (indicators.vol_20d * 100).toFixed(1) + '%' : '-'}
                              </p>
                          </div>
                          <div className="bg-[#1e293b] p-3 rounded-xl border border-slate-700/50">
                              <p className="text-[10px] text-slate-400 uppercase mb-1 flex items-center gap-1">
                                  <Activity size={12}/> Return (20d)
                              </p>
                              <p className={`text-lg font-bold ${indicators.ret_20d > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {indicators.ret_20d ? (indicators.ret_20d * 100).toFixed(1) + '%' : '-'}
                              </p>
                          </div>
                      </div>
                      
                      {/* Bollinger Bands snippet */}
                       <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                           <h3 className="text-sm font-semibold text-slate-200 mb-2">Bollinger Bands</h3>
                           <div className="flex justify-between items-center text-xs font-mono">
                               <span className="text-slate-400">Low: <span className="text-white">{indicators.bb_low?.toFixed(2) || '-'}</span></span>
                               <span className="text-slate-500">&lt;-- Price --&gt;</span>
                               <span className="text-slate-400">High: <span className="text-white">{indicators.bb_up?.toFixed(2) || '-'}</span></span>
                           </div>
                       </div>
                       
                       {/* Analyst View & Risk Meter */}
                       <div className="grid grid-cols-2 gap-3 mt-4">
                           {/* Risk Meter */}
                           <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                               <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                   <Gauge size={16} className="text-orange-400" />
                                   Risk Meter
                               </h3>
                               {riskMeter ? (
                                   <div className="flex flex-col items-center justify-center">
                                        <div className="text-lg font-bold text-white text-center">
                                            {riskMeter.categoryName || "N/A"}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Volatility (Std Dev): {riskMeter.stdDev || "-"}
                                        </div>
                                   </div>
                               ) : (
                                   <div className="text-xs text-slate-500 text-center py-2">No risk data</div>
                               )}
                           </div>
                           
                           {/* Analyst Ratings Overview */}
                           <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                               <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                   <Users size={16} className="text-indigo-400" />
                                   Analyst View
                               </h3>
                               {analystView && analystView.length > 0 ? (
                                   <div className="flex flex-col gap-2">
                                        <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-700">
                                            {analystView.map((av, idx) => {
                                                if (av.ratingName === "Total") return null;
                                                const totalStr = analystView.find(a => a.ratingName === "Total")?.numberOfAnalystsLatest || "1";
                                                const total = parseFloat(totalStr) || 1;
                                                const val = parseFloat(av.numberOfAnalystsLatest) || 0;
                                                if (val === 0) return null;
                                                const pct = (val / total) * 100;
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        style={{ width: `${pct}%`, backgroundColor: av.colorCode || '#898989' }} 
                                                        title={`${av.ratingName}: ${val}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                                            {analystView.filter(av => av.ratingName !== "Total" && parseFloat(av.numberOfAnalystsLatest) > 0).map((av, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <span style={{ color: av.colorCode || '#898989' }}>{parseFloat(av.numberOfAnalystsLatest)}</span>
                                                    <span>{av.ratingName.split(' ')[0]}</span>
                                                </div>
                                            ))}
                                        </div>
                                   </div>
                               ) : (
                                   <div className="text-xs text-slate-500 text-center py-2">No analyst data</div>
                               )}
                           </div>
                       </div>

                  </div>
              )}

              {/* Latest News Section */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mt-4 pt-4">
                  <div className="flex items-center gap-2">
                      <FileText className="text-blue-400" size={20} />
                      <h2 className="text-lg font-bold text-white">Latest News</h2>
                  </div>
                  {loadingNews && <div className="text-xs text-blue-400 animate-pulse font-mono">FETCHING...</div>}
              </div>

              {!loadingNews && news.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 pb-8">
                      <AlertTriangle size={24} className="opacity-50" />
                      <p className="text-sm">No recent news available</p>
                  </div>
              )}

              {!loadingNews && news.length > 0 && (
                  <div className="space-y-4 animate-in fade-in duration-500 pb-4">
                      {news.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors group">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-slate-200 mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                            {item.headline}
                                        </h3>
                                        {/* Format the date appropriately if provided, else just show source */}
                                        <p className="text-xs text-slate-400">
                                            {new Date(item.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <a 
                                        href={item.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 bg-slate-700/50 rounded-lg hover:bg-blue-500 hover:text-white text-slate-400 transition-all shrink-0"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                          </div>
                      ))}
                  </div>
              )}

          </div>
      </div>
      ) : (
          /* Portfolio Analytics View */
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 animate-in fade-in duration-500 pb-8">
              {loadingPortfolio ? (
                  <div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">
                      Loading Portfolio Analytics...
                  </div>
              ) : portfolioData ? (
                  <>
                      {/* Risk Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] shadow-lg flex items-center gap-4">
                              <div className="p-3 bg-red-500/20 rounded-lg text-red-400">
                                  <Activity size={24} />
                              </div>
                              <div>
                                  <p className="text-xs text-slate-400 uppercase">Annualized Volatility</p>
                                  <p className="text-2xl font-bold text-white">{(portfolioData.risk?.volatility * 100).toFixed(2)}%</p>
                              </div>
                          </div>
                          
                          <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] shadow-lg flex items-center gap-4">
                              <div className="p-3 bg-orange-500/20 rounded-lg text-orange-400">
                                  <TrendingDown size={24} />
                              </div>
                              <div>
                                  <p className="text-xs text-slate-400 uppercase">Max Drawdown</p>
                                  <p className="text-2xl font-bold text-white">{(portfolioData.risk?.max_drawdown * 100).toFixed(2)}%</p>
                              </div>
                          </div>

                          <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] shadow-lg flex items-center gap-4">
                              <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                                  <TrendingUp size={24} />
                              </div>
                              <div>
                                  <p className="text-xs text-slate-400 uppercase">Sharpe Ratio</p>
                                  <p className="text-2xl font-bold text-white">{portfolioData.risk?.sharpe_ratio}</p>
                              </div>
                          </div>
                          
                          <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] shadow-lg flex items-center gap-4">
                              <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
                                  <Gauge size={24} />
                              </div>
                              <div>
                                  <p className="text-xs text-slate-400 uppercase">Risk Profile</p>
                                  <p className="text-2xl font-bold text-white">{portfolioData.risk?.risk_score}</p>
                              </div>
                          </div>
                      </div>

                      {/* Charts Row 1 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Growth Trajectory */}
                          <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] shadow-lg">
                              <div className="flex items-center gap-2 mb-6">
                                  <LineChartIcon className="text-blue-400" size={20} />
                                  <h3 className="text-lg font-bold text-white">Portfolio Growth (30D)</h3>
                              </div>
                              <div className="h-72 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={portfolioData.growth}>
                                          <defs>
                                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                              </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                          <XAxis 
                                              dataKey="date" 
                                              stroke="#64748b" 
                                              fontSize={12} 
                                              tickLine={false} 
                                              axisLine={false}
                                              tickFormatter={(val) => {
                                                  const d = new Date(val);
                                                  return `${d.getDate()}/${d.getMonth()+1}`;
                                              }}
                                          />
                                          <YAxis 
                                              stroke="#64748b" 
                                              fontSize={12} 
                                              tickLine={false} 
                                              axisLine={false}
                                              domain={['auto', 'auto']}
                                              tickFormatter={(val) => `₹${val.toLocaleString()}`}
                                              width={80}
                                          />
                                          <RechartsTooltip 
                                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                              itemStyle={{ color: '#fff' }}
                                              formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Value']}
                                              labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                          />
                                          <Line 
                                              type="monotone" 
                                              dataKey="value" 
                                              stroke="#3b82f6" 
                                              strokeWidth={3}
                                              dot={false}
                                              activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                                          />
                                      </LineChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>

                          {/* Asset Allocation */}
                          <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] shadow-lg">
                              <div className="flex items-center gap-2 mb-6">
                                  <PieChartIcon className="text-emerald-400" size={20} />
                                  <h3 className="text-lg font-bold text-white">Asset Allocation</h3>
                              </div>
                              <div className="h-72 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                          <Pie
                                              data={portfolioData.allocation}
                                              cx="50%"
                                              cy="50%"
                                              innerRadius={60}
                                              outerRadius={100}
                                              paddingAngle={4}
                                              dataKey="value"
                                              nameKey="symbol"
                                          >
                                              {portfolioData.allocation?.map((entry: any, index: number) => (
                                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                              ))}
                                          </Pie>
                                          <RechartsTooltip 
                                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                              formatter={(value: any, name: any, props: any) => [
                                                  `₹${Number(value).toLocaleString()} (${props.payload.percentage}%)`, 
                                                  props.payload.symbol
                                              ]}
                                          />
                                          <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} formatter={(value: any, entry: any) => entry.payload?.symbol || value} />
                                      </PieChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                      </div>
                      
                      {/* Sector Diversification */}
                      <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] shadow-lg">
                          <div className="flex items-center gap-2 mb-6">
                              <Layers className="text-purple-400" size={20} />
                              <h3 className="text-lg font-bold text-white">Sector Diversification</h3>
                          </div>
                          <div className="h-72 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie
                                          data={portfolioData.sectors}
                                          cx="40%"
                                          cy="50%"
                                          outerRadius={100}
                                          dataKey="value"
                                          nameKey="name"
                                          paddingAngle={3}
                                      >
                                          {portfolioData.sectors?.map((entry: any, index: number) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} stroke="transparent" />
                                          ))}
                                      </Pie>
                                      <RechartsTooltip 
                                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                          formatter={(value: any, name: any, props: any) => [
                                              `₹${Number(value).toLocaleString()} (${props.payload.percentage}%)`, 
                                              name
                                          ]}
                                      />
                                      <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                  </PieChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                      
                  </>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
                      <AlertTriangle size={32} className="opacity-50" />
                      <p className="text-sm">No portfolio data available</p>
                  </div>
              )}
          </div>
      )}

       <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569; 
        }
      `}</style>

    </div>
  );
}
