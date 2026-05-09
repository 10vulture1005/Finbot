"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import {
  TrendingUp, History, Coins, Grid3X3, FlaskConical, Loader2, ArrowUpDown, 
  IndianRupee, Calendar, Percent, AlertTriangle, ChevronDown, Plus, Minus
} from "lucide-react";
import { usePortfolio } from "@/app/context/PortfolioContext";
import api from "@/app/services/api";

type TabId = "backtest" | "dividends" | "correlation" | "whatif";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "backtest", label: "Backtest", icon: History },
  { id: "dividends", label: "Dividends", icon: Coins },
  { id: "correlation", label: "Correlation", icon: Grid3X3 },
  { id: "whatif", label: "What-If", icon: FlaskConical },
];

// ─── Backtest Tab ─────────────────────────────────────────────────────────────
function BacktestTab() {
  const [period, setPeriod] = useState("1y");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchBacktest = async (p: string) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/quant/backtest?period=${p}`);
      if (res.success && res.data) setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBacktest(period); }, [period]);

  // Merge portfolio & nifty into single array for chart
  const chartData = React.useMemo(() => {
    if (!data) return [];
    const map = new Map<string, any>();
    (data.portfolio || []).forEach((p: any) => map.set(p.date, { date: p.date, Portfolio: p.value }));
    (data.nifty50 || []).forEach((n: any) => {
      const existing = map.get(n.date) || { date: n.date };
      existing["NIFTY 50"] = n.value;
      map.set(n.date, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {["1y", "3y", "5y"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              period === p
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : data ? (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Your Portfolio</p>
              <p className={`text-2xl font-bold ${data.portfolio_return >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {data.portfolio_return >= 0 ? "+" : ""}{data.portfolio_return}%
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">NIFTY 50</p>
              <p className={`text-2xl font-bold ${data.nifty_return >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {data.nifty_return >= 0 ? "+" : ""}{data.nifty_return}%
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Alpha</p>
              <p className={`text-2xl font-bold ${data.alpha >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {data.alpha >= 0 ? "+" : ""}{data.alpha}%
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Performance (Normalized to 100)</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={(v) => v.slice(5)}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Portfolio" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="NIFTY 50" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-center py-20">No backtest data available.</p>
      )}
    </div>
  );
}

// ─── Dividends Tab ────────────────────────────────────────────────────────────
function DividendsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("/quant/dividends").then((res) => {
      if (res.success && res.data) setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[300px]"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!data) return <p className="text-muted-foreground text-center py-20">No dividend data.</p>;

  return (
    <div className="space-y-6">
      {/* Total Income Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl p-6">
        <p className="text-sm text-muted-foreground mb-1">Projected Annual Dividend Income</p>
        <p className="text-4xl font-bold text-emerald-500">₹{data.total_annual_income.toLocaleString()}</p>
      </div>

      {/* Holdings Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Stock</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Qty</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Yield</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Annual Income</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Last Dividend</th>
            </tr>
          </thead>
          <tbody>
            {(data.holdings || []).map((h: any) => (
              <tr key={h.symbol} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{h.symbol.replace(".NS", "")}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{h.quantity}</td>
                <td className="px-4 py-3 text-right">
                  <span className={h.dividend_yield > 0 ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
                    {h.dividend_yield}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">₹{h.annual_income.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                  {h.last_dividend ? `₹${h.last_dividend.amount} on ${h.last_dividend.date}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Correlation Tab ──────────────────────────────────────────────────────────
function CorrelationTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("/quant/correlation").then((res) => {
      if (res.success && res.data) setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[300px]"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!data) return <p className="text-muted-foreground text-center py-20">Need at least 2 holdings.</p>;

  const labels: string[] = data.labels;
  const matrix: { x: string; y: string; value: number }[] = data.matrix;

  const getColor = (v: number) => {
    if (v >= 0.8) return "bg-red-500/80 text-white";
    if (v >= 0.5) return "bg-orange-500/60 text-white";
    if (v >= 0.2) return "bg-amber-400/50 text-foreground";
    if (v >= -0.2) return "bg-gray-300/30 text-foreground";
    if (v >= -0.5) return "bg-cyan-400/50 text-foreground";
    return "bg-blue-500/70 text-white";
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Correlation ranges from -1 (inverse) to +1 (moves together). High correlation = concentration risk.
      </p>
      <div className="bg-card border border-border rounded-xl p-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-xs font-medium text-muted-foreground"></th>
              {labels.map((l) => (
                <th key={l} className="p-2 text-xs font-semibold text-center min-w-[60px]">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((row) => (
              <tr key={row}>
                <td className="p-2 text-xs font-semibold whitespace-nowrap">{row}</td>
                {labels.map((col) => {
                  const cell = matrix.find((m) => m.y === row && m.x === col);
                  const val = cell?.value ?? 0;
                  return (
                    <td key={col} className="p-1">
                      <div
                        className={`rounded-lg p-2 text-center text-xs font-bold transition-all ${getColor(val)}`}
                        title={`${row} ↔ ${col}: ${val.toFixed(3)}`}
                      >
                        {val === 1 ? "1.0" : val.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-blue-500/70" /> -1 Inverse</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-gray-300/30 border border-border" /> 0 Neutral</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-red-500/80" /> +1 Correlated</div>
      </div>
    </div>
  );
}

// ─── What-If Tab ──────────────────────────────────────────────────────────────
function WhatIfTab() {
  const { portfolio } = usePortfolio();
  const [addList, setAddList] = useState<{ symbol: string; quantity: string; avg_price: string }[]>([]);
  const [removeList, setRemoveList] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const toggleRemove = (sym: string) => {
    setRemoveList((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const addEntry = () => setAddList([...addList, { symbol: "", quantity: "", avg_price: "" }]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const payload = {
        add: addList
          .filter((a) => a.symbol && a.quantity && a.avg_price)
          .map((a) => ({ symbol: a.symbol, quantity: parseFloat(a.quantity), avg_price: parseFloat(a.avg_price) })),
        remove: removeList,
      };
      const res = await api.post<any>("/quant/whatif", payload);
      if (res.success && res.data) setResult(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const MetricCompare = ({ label, current, hypothetical, unit, invert }: any) => {
    const diff = hypothetical - current;
    const better = invert ? diff < 0 : diff > 0;
    return (
      <div className="bg-muted/30 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">{hypothetical}{unit}</span>
          <span className={`text-xs font-semibold ${better ? "text-emerald-500" : "text-red-500"}`}>
            {diff >= 0 ? "+" : ""}{diff.toFixed(2)}{unit}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Current: {current}{unit}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Remove Section */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Minus size={16} /> Remove from Portfolio</h4>
        <div className="flex flex-wrap gap-2">
          {(portfolio || []).map((h) => (
            <button
              key={h.symbol}
              onClick={() => toggleRemove(h.symbol)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                removeList.includes(h.symbol)
                  ? "bg-red-500/15 text-red-500 border-red-500/30"
                  : "bg-muted/50 text-foreground border-border hover:border-red-500/30"
              }`}
            >
              {h.symbol.replace(".NS", "")} {removeList.includes(h.symbol) && "✕"}
            </button>
          ))}
        </div>
      </div>

      {/* Add Section */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Plus size={16} /> Add to Portfolio</h4>
        {addList.map((a, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <input
              placeholder="Symbol (e.g. TCS)"
              value={a.symbol}
              onChange={(e) => { const n = [...addList]; n[i].symbol = e.target.value.toUpperCase(); setAddList(n); }}
              className="px-3 py-2 bg-background border border-input rounded-lg text-sm"
            />
            <input
              placeholder="Quantity"
              type="number"
              value={a.quantity}
              onChange={(e) => { const n = [...addList]; n[i].quantity = e.target.value; setAddList(n); }}
              className="px-3 py-2 bg-background border border-input rounded-lg text-sm"
            />
            <input
              placeholder="Avg Price"
              type="number"
              value={a.avg_price}
              onChange={(e) => { const n = [...addList]; n[i].avg_price = e.target.value; setAddList(n); }}
              className="px-3 py-2 bg-background border border-input rounded-lg text-sm"
            />
          </div>
        ))}
        <button onClick={addEntry} className="text-sm text-primary font-medium hover:underline flex items-center gap-1 mt-1">
          <Plus size={14} /> Add another stock
        </button>
      </div>

      <button
        onClick={runSimulation}
        disabled={loading || (addList.length === 0 && removeList.length === 0)}
        className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <FlaskConical size={18} />}
        Run Simulation
      </button>

      {result && (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Simulation Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCompare label="Volatility" current={(result.current.volatility * 100).toFixed(1)} hypothetical={(result.hypothetical.volatility * 100).toFixed(1)} unit="%" invert />
            <MetricCompare label="Sharpe Ratio" current={result.current.sharpe.toFixed(2)} hypothetical={result.hypothetical.sharpe.toFixed(2)} unit="" />
            <MetricCompare label="Expected Return" current={((result.current.expected_return || 0) * 100).toFixed(1)} hypothetical={((result.hypothetical.expected_return || 0) * 100).toFixed(1)} unit="%" />
            <MetricCompare label="Total Value" current={`₹${(result.current.total_value || 0).toLocaleString()}`} hypothetical={`₹${(result.hypothetical.total_value || 0).toLocaleString()}`} unit="" />
          </div>

          {/* Sector comparison */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Current Sectors", sectors: result.current.sectors },
              { title: "Hypothetical Sectors", sectors: result.hypothetical.sectors },
            ].map(({ title, sectors }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-4">
                <h5 className="text-sm font-semibold mb-2">{title}</h5>
                {Object.entries(sectors || {}).map(([sec, pct]: any) => (
                  <div key={sec} className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">{sec}</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("backtest");

  const TabContent = {
    backtest: BacktestTab,
    dividends: DividendsTab,
    correlation: CorrelationTab,
    whatif: WhatIfTab,
  };

  const ActiveComponent = TabContent[activeTab];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Analytics Lab</h1>
        <p className="text-muted-foreground">Backtest, dividends, correlations, and what-if simulations.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        <ActiveComponent />
      </div>
    </div>
  );
}
