"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Calculator,
  PieChart,
  TrendingUp,
  Check,
  X,
} from "lucide-react";
import type { AgentStatus } from "./types";

const AGENT_ICONS: Record<string, React.ElementType> = {
  goal_interpreter: Brain,
  sip_calculator: Calculator,
  asset_allocator: PieChart,
  market_analyst: TrendingUp,
};

const AGENT_COLORS: Record<string, { ring: string; glow: string; bg: string }> = {
  goal_interpreter: {
    ring: "ring-blue-500/60",
    glow: "shadow-blue-500/40",
    bg: "bg-blue-500/10",
  },
  sip_calculator: {
    ring: "ring-emerald-500/60",
    glow: "shadow-emerald-500/40",
    bg: "bg-emerald-500/10",
  },
  asset_allocator: {
    ring: "ring-purple-500/60",
    glow: "shadow-purple-500/40",
    bg: "bg-purple-500/10",
  },
  market_analyst: {
    ring: "ring-amber-500/60",
    glow: "shadow-amber-500/40",
    bg: "bg-amber-500/10",
  },
};

interface SwarmNodeProps {
  agent: AgentStatus;
  index: number;
}

export default function SwarmNode({ agent, index }: SwarmNodeProps) {
  const Icon = AGENT_ICONS[agent.id] || Brain;
  const colors = AGENT_COLORS[agent.id] || AGENT_COLORS.goal_interpreter;
  const latestThoughts = agent.thoughts.slice(-2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.4, type: "spring" }}
      className="flex flex-col items-center gap-2 relative"
    >
      {/* Node Circle */}
      <motion.div
        animate={
          agent.status === "thinking"
            ? {
                scale: [1, 1.08, 1],
                boxShadow: [
                  `0 0 0px rgba(99,102,241,0)`,
                  `0 0 30px rgba(99,102,241,0.5)`,
                  `0 0 0px rgba(99,102,241,0)`,
                ],
              }
            : agent.status === "done"
            ? { scale: 1, boxShadow: `0 0 20px rgba(16,185,129,0.4)` }
            : agent.status === "error"
            ? { scale: 1, boxShadow: `0 0 20px rgba(239,68,68,0.4)` }
            : { scale: 1, boxShadow: `0 0 0px rgba(0,0,0,0)` }
        }
        transition={
          agent.status === "thinking"
            ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
            : { duration: 0.4 }
        }
        className={`
          relative w-[72px] h-[72px] rounded-full flex items-center justify-center
          border-2 transition-colors duration-300
          ${
            agent.status === "idle"
              ? "border-border/30 bg-card/20"
              : agent.status === "thinking"
              ? `border-primary/60 ${colors.bg}`
              : agent.status === "done"
              ? "border-emerald-500/60 bg-emerald-500/10"
              : "border-destructive/60 bg-destructive/10"
          }
        `}
      >
        {/* Rotating border ring when thinking */}
        {agent.status === "thinking" && (
          <motion.div
            className={`absolute inset-[-3px] rounded-full border-2 border-transparent border-t-primary/70 border-r-primary/30`}
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }}
          />
        )}

        {/* Icon */}
        <Icon
          className={`w-7 h-7 transition-colors duration-300 ${
            agent.status === "idle"
              ? "text-muted-foreground/40"
              : agent.status === "thinking"
              ? "text-primary"
              : agent.status === "done"
              ? "text-emerald-400"
              : "text-destructive"
          }`}
        />

        {/* Status overlay */}
        {agent.status === "done" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
        {agent.status === "error" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
          >
            <X className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Agent Name */}
      <span
        className={`text-xs font-medium transition-colors duration-300 ${
          agent.status === "idle"
            ? "text-muted-foreground/50"
            : agent.status === "thinking"
            ? "text-primary"
            : agent.status === "done"
            ? "text-emerald-400"
            : "text-destructive"
        }`}
      >
        {agent.name}
      </span>

      {/* Thought Bubble */}
      <AnimatePresence mode="popLayout">
        {agent.status === "thinking" && latestThoughts.length > 0 && (
          <motion.div
            key={latestThoughts[latestThoughts.length - 1]}
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full mt-8 w-48 bg-card/60 backdrop-blur-md border border-border/30 rounded-lg px-3 py-2 shadow-lg"
          >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card/60 border-l border-t border-border/30 rotate-45" />
            <p className="text-[11px] text-muted-foreground leading-relaxed relative z-10">
              {latestThoughts[latestThoughts.length - 1]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
