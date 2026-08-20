"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import type { SwarmOptions } from "./useSwarm";

const EXAMPLE_PROMPTS = [
  "₹2 Crores for retirement in 15 years",
  "₹50 Lakhs for house down payment in 5 years",
  "₹1 Crore for child's education in 10 years",
  "₹30 Lakhs emergency fund in 3 years",
];

interface ChatPanelProps {
  onLaunch: (goal: string, options?: SwarmOptions) => void;
  onReset: () => void;
  isRunning: boolean;
  hasPlan: boolean;
}

export default function ChatPanel({
  onLaunch,
  onReset,
  isRunning,
  hasPlan,
}: ChatPanelProps) {
  const [goal, setGoal] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [initialCapital, setInitialCapital] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [riskTolerance, setRiskTolerance] = useState("");

  const handleSubmit = () => {
    if (!goal.trim() || isRunning) return;
    const options: SwarmOptions = {};
    if (initialCapital) options.initial_capital = Number(initialCapital);
    if (monthlyIncome) options.monthly_income = Number(monthlyIncome);
    if (riskTolerance) options.risk_tolerance = riskTolerance;
    onLaunch(goal.trim(), options);
  };

  const handleExampleClick = (prompt: string) => {
    setGoal(prompt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            Describe Your Goal
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Tell the AI swarm about your financial goal
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Text Input */}
        <div>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="I want to save ₹2 Crores for retirement in 15 years with moderate risk..."
            rows={4}
            disabled={isRunning}
            className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleSubmit();
            }}
          />
        </div>

        {/* Example Prompts */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleExampleClick(prompt)}
                disabled={isRunning}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            Advanced Options
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Initial Capital (₹)
                    </label>
                    <input
                      type="number"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(e.target.value)}
                      placeholder="e.g. 500000"
                      disabled={isRunning}
                      className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Monthly Income (₹)
                    </label>
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      placeholder="e.g. 100000"
                      disabled={isRunning}
                      className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Risk Tolerance
                    </label>
                    <select
                      value={riskTolerance}
                      onChange={(e) => setRiskTolerance(e.target.value)}
                      disabled={isRunning}
                      className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                    >
                      <option value="">Auto-detect</option>
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-4 border-t border-border/30 space-y-2">
        {hasPlan ? (
          <button
            onClick={() => {
              onReset();
              setGoal("");
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Plan New Goal
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!goal.trim() || isRunning}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-chart-4 text-primary-foreground hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Swarm Running...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Launch Swarm
              </>
            )}
          </button>
        )}

        {!goal.trim() && !isRunning && !hasPlan && (
          <p className="text-xs text-muted-foreground/60 text-center">
            Enter a goal or pick an example above
          </p>
        )}
      </div>
    </motion.div>
  );
}
