"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Loader2, ArrowDown, ArrowUp, Clock, Shield, AlertTriangle } from "lucide-react";
import api from "@/app/services/api";

interface TaxItem {
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  unrealised_pnl: number;
  unrealised_pnl_pct: number;
  days_held: number;
  tax_type: "STCG" | "LTCG";
  tax_rate: number;
  tax_liability: number;
  tax_saving: number;
  action: "harvest" | "hold" | "caution" | "none";
  reason: string;
  priority: number;
}

const ACTION_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  harvest: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-500", icon: ArrowDown, label: "Harvest" },
  hold: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-500", icon: Clock, label: "Hold" },
  caution: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-500", icon: AlertTriangle, label: "Caution" },
  none: { bg: "bg-muted/30 border-border", text: "text-muted-foreground", icon: Shield, label: "OK" },
};

export default function TaxHarvestPage() {
  const [data, setData] = useState<TaxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("/quant/tax-harvest")
      .then((res) => { if (res.success && res.data) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  const totalSavings = data.filter((d) => d.action === "harvest").reduce((s, d) => s + d.tax_saving, 0);
  const harvestCount = data.filter((d) => d.action === "harvest").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
          <Receipt size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Harvest Suggester</h1>
          <p className="text-muted-foreground">Scan your holdings for STCG/LTCG tax-loss harvesting opportunities.</p>
        </div>
      </div>

      {/* Summary Banner */}
      {!loading && harvestCount > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Potential Tax Savings</p>
              <p className="text-3xl font-bold text-emerald-500">₹{totalSavings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Harvest Candidates</p>
              <p className="text-3xl font-bold">{harvestCount} stocks</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground text-center py-20">No holdings to analyse.</p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => {
            const style = ACTION_STYLES[item.action] || ACTION_STYLES.none;
            const ActionIcon = style.icon;
            return (
              <div
                key={item.symbol}
                className={`rounded-xl border p-4 ${style.bg} transition-all hover:shadow-sm`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.text} bg-background/50`}>
                      <ActionIcon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold">{item.symbol.replace(".NS", "")}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.tax_type === "STCG" ? "bg-amber-500/15 text-amber-600" : "bg-blue-500/15 text-blue-500"
                        }`}>
                          {item.tax_type}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.text} bg-background/50`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80">{item.reason}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-bold ${item.unrealised_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {item.unrealised_pnl >= 0 ? "+" : ""}₹{item.unrealised_pnl.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.unrealised_pnl_pct >= 0 ? "+" : ""}{item.unrealised_pnl_pct.toFixed(1)}% · {item.days_held}d held
                    </p>
                  </div>
                </div>
                {/* Tax Details */}
                <div className="mt-3 pt-3 border-t border-border/30 flex gap-6 text-xs text-muted-foreground">
                  <span>Qty: {item.quantity}</span>
                  <span>Avg: ₹{item.avg_price.toLocaleString()}</span>
                  <span>CMP: ₹{item.current_price.toLocaleString()}</span>
                  <span>Tax Rate: {(item.tax_rate * 100).toFixed(1)}%</span>
                  {item.tax_saving > 0 && (
                    <span className="text-emerald-500 font-semibold">Save: ₹{item.tax_saving.toLocaleString()}</span>
                  )}
                  {item.tax_liability > 0 && (
                    <span className="text-red-500 font-semibold">Tax: ₹{item.tax_liability.toLocaleString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
