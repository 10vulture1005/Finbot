"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Timer,
  Shield,
  Wallet,
  IndianRupee,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { FinalPlan } from "./types";

// Chart colors that feel premium
const CHART_COLORS = [
  "hsl(220, 80%, 55%)",   // Blue
  "hsl(160, 70%, 45%)",   // Emerald
  "hsl(280, 65%, 55%)",   // Purple
  "hsl(40, 85%, 55%)",    // Amber
  "hsl(340, 70%, 55%)",   // Rose
  "hsl(190, 75%, 45%)",   // Cyan
  "hsl(120, 50%, 45%)",   // Green
];

function formatINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
}

interface BlueprintPanelProps {
  plan: FinalPlan | null;
  isRunning: boolean;
}

// Skeleton shimmer block
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-border/20 rounded-lg animate-pulse ${className}`}
    />
  );
}

export default function BlueprintPanel({ plan, isRunning }: BlueprintPanelProps) {
  const showSkeleton = isRunning && !plan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full flex flex-col bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Blueprint</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {plan
            ? "Your financial plan is ready"
            : isRunning
            ? "Building your plan..."
            : "Results will appear here"}
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Empty state */}
        {!plan && !isRunning && (
          <div className="flex-1 flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground/40 text-center">
              Launch the swarm to generate<br />your financial blueprint
            </p>
          </div>
        )}

        {/* Skeleton state */}
        {showSkeleton && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-10" />
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </>
        )}

        {/* Plan content */}
        <AnimatePresence>
          {plan && (
            <>
              {/* Section 1: Goal Summary */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Goal Summary
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={<Target className="w-4 h-4 text-blue-400" />}
                    label="Target"
                    value={formatINR(plan.goal.target_amount)}
                  />
                  <StatCard
                    icon={<Timer className="w-4 h-4 text-emerald-400" />}
                    label="Timeline"
                    value={`${plan.goal.timeline_years} years`}
                  />
                  <StatCard
                    icon={<Shield className="w-4 h-4 text-purple-400" />}
                    label="Risk"
                    value={plan.goal.risk_tolerance}
                  />
                  <StatCard
                    icon={<Wallet className="w-4 h-4 text-amber-400" />}
                    label="Initial"
                    value={formatINR(plan.goal.initial_capital)}
                  />
                </div>
                {plan.goal.goal_summary && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    &quot;{plan.goal.goal_summary}&quot;
                  </p>
                )}
              </motion.div>

              {/* Section 2: SIP Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-primary/10 to-chart-4/10 rounded-xl p-4 border border-primary/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="w-5 h-5 text-primary" />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Monthly SIP
                  </h4>
                </div>
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-4 bg-clip-text text-transparent">
                  {formatINR(plan.sip.monthly_sip)}/mo
                </p>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span>
                    CAGR: <strong className="text-foreground">{(plan.sip.expected_cagr * 100).toFixed(0)}%</strong>
                  </span>
                  <span>
                    Corpus: <strong className="text-foreground">{formatINR(plan.sip.projected_corpus)}</strong>
                  </span>
                </div>
              </motion.div>

              {/* Section 3: Allocation Chart */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Asset Allocation
                </h4>
                <div className="bg-card/20 rounded-xl p-4 border border-border/30">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={plan.allocation.slices}
                        dataKey="percentage"
                        nameKey="asset_class"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {plan.allocation.slices.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0,0,0,0.85)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number, name: string) => [
                          `${value}%`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                    {plan.allocation.slices.map((slice, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {slice.asset_class}{" "}
                          <span className="text-foreground font-medium">
                            {slice.percentage}%
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Section 4: Recommended Picks */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Recommended Picks
                </h4>
                <div className="space-y-2">
                  {plan.picks.map((pick, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className="bg-card/20 rounded-lg p-3 border border-border/30 hover:border-primary/30 transition-colors cursor-default"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {pick.symbol}
                          </span>
                          <p className="text-sm text-foreground mt-1 font-medium">
                            {pick.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {pick.asset_class}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-foreground bg-card/50 px-2 py-1 rounded-md">
                          {pick.weight}%
                        </span>
                      </div>
                      {pick.rationale && (
                        <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
                          {pick.rationale}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Section 5: Wealth Projection */}
              {plan.projected_values.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    <TrendingUp className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    Wealth Projection
                  </h4>
                  <div className="bg-card/20 rounded-xl p-4 border border-border/30">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={plan.projected_values}>
                        <defs>
                          <linearGradient
                            id="projGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(220, 80%, 55%)"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(220, 80%, 55%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="year"
                          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                          tickLine={false}
                          axisLine={false}
                          label={{
                            value: "Year",
                            position: "insideBottom",
                            offset: -5,
                            fontSize: 10,
                            fill: "rgba(255,255,255,0.3)",
                          }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                          tickFormatter={(v) => formatINR(v)}
                          tickLine={false}
                          axisLine={false}
                          width={60}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.85)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [
                            formatINR(value),
                            "Portfolio Value",
                          ]}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <ReferenceLine
                          y={plan.goal.target_amount}
                          stroke="rgba(16,185,129,0.5)"
                          strokeDasharray="6 4"
                          label={{
                            value: `Target: ${formatINR(plan.goal.target_amount)}`,
                            position: "insideTopRight",
                            fontSize: 10,
                            fill: "rgba(16,185,129,0.7)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(220, 80%, 55%)"
                          strokeWidth={2}
                          fill="url(#projGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card/20 rounded-xl p-3 border border-border/30">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground capitalize">{value}</p>
    </div>
  );
}
