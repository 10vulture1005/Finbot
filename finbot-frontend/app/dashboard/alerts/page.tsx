"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing, Plus, Trash2, Loader2, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/app/services/api";

interface Alert {
  id: number;
  symbol: string;
  target_price: number;
  condition: "above" | "below";
  is_triggered: boolean;
  created_at: string;
}

interface TriggeredAlert {
  id: number;
  symbol: string;
  target_price: number;
  current_price: number;
  condition: string;
  message: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [triggered, setTriggered] = useState<TriggeredAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(false);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCondition, setNewCondition] = useState<"above" | "below">("above");

  const fetchAlerts = async () => {
    try {
      const res = await api.get<any>("/alerts");
      if (res.success && res.data) setAlerts(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const checkAlerts = async () => {
    setChecking(true);
    try {
      const res = await api.get<any>("/alerts/check");
      if (res.success && res.data && res.data.length > 0) {
        setTriggered(res.data);
        res.data.forEach((t: TriggeredAlert) => toast.success(t.message));
        fetchAlerts(); // Refresh to show triggered state
      } else {
        toast.info("No alerts triggered at current prices.");
      }
    } catch (e) { console.error(e); }
    finally { setChecking(false); }
  };

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || !newPrice) return;
    setCreating(true);
    try {
      const res = await api.post<any>("/alerts", {
        symbol: newSymbol.toUpperCase(),
        target_price: parseFloat(newPrice),
        condition: newCondition,
      });
      if (res.success) {
        toast.success("Alert created!");
        setShowForm(false);
        setNewSymbol("");
        setNewPrice("");
        fetchAlerts();
      } else {
        toast.error(res.error || "Failed to create alert");
      }
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const deleteAlert = async (id: number) => {
    try {
      const res = await api.delete<any>(`/alerts/${id}`);
      if (res.success) {
        toast.success("Alert deleted");
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchAlerts(); }, []);

  // Auto-check on mount
  useEffect(() => {
    if (!loading && alerts.filter((a) => !a.is_triggered).length > 0) {
      checkAlerts();
    }
  }, [loading]);

  const activeAlerts = alerts.filter((a) => !a.is_triggered);
  const triggeredAlerts = alerts.filter((a) => a.is_triggered);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
            <Bell size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Price Alerts</h1>
            <p className="text-muted-foreground">Get notified when stocks hit your target prices.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={checkAlerts}
            disabled={checking || activeAlerts.length === 0}
            className="px-4 py-2 bg-amber-500/10 text-amber-500 rounded-lg font-medium hover:bg-amber-500/20 transition-colors border border-amber-500/20 disabled:opacity-40 flex items-center gap-2"
          >
            {checking ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />}
            Check Now
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> New Alert
          </button>
        </div>
      </div>

      {/* Triggered Notifications */}
      {triggered.length > 0 && (
        <div className="space-y-2">
          {triggered.map((t) => (
            <div key={t.id} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="text-emerald-500 shrink-0" size={20} />
              <p className="text-sm font-medium">{t.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4">Create Price Alert</h2>
            <form onSubmit={createAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stock Symbol</label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. RELIANCE.NS"
                  className="w-full p-2.5 rounded-lg border border-input bg-background text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 rounded-lg border border-input bg-background text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCondition("above")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                      newCondition === "above"
                        ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                        : "bg-muted/50 text-muted-foreground border-border"
                    }`}
                  >
                    <TrendingUp size={16} /> Goes Above
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCondition("below")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                      newCondition === "below"
                        ? "bg-red-500/15 text-red-500 border-red-500/30"
                        : "bg-muted/50 text-muted-foreground border-border"
                    }`}
                  >
                    <TrendingDown size={16} /> Goes Below
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
                  Create Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <>
          {/* Active Alerts */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold">Active Alerts ({activeAlerts.length})</h3>
            </div>
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <Bell size={40} className="text-muted-foreground/30" />
                <p className="text-muted-foreground">No active alerts. Create one to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        alert.condition === "above" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {alert.condition === "above" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{alert.symbol.replace(".NS", "")}</p>
                        <p className="text-xs text-muted-foreground">
                          Alert when price goes {alert.condition} ₹{alert.target_price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Triggered Alerts */}
          {triggeredAlerts.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold text-muted-foreground">Triggered ({triggeredAlerts.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {triggeredAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between px-4 py-3.5 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        <CheckCircle size={18} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm line-through">{alert.symbol.replace(".NS", "")}</p>
                        <p className="text-xs text-muted-foreground">
                          ₹{alert.target_price.toLocaleString()} · {alert.condition}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
