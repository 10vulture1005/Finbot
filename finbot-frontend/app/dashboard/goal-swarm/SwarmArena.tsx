"use client";

import React from "react";
import { motion } from "framer-motion";
import { Orbit } from "lucide-react";
import SwarmNode from "./SwarmNode";
import type { AgentStatus } from "./types";

interface SwarmArenaProps {
  agents: AgentStatus[];
}

export default function SwarmArena({ agents }: SwarmArenaProps) {
  const allIdle = agents.every((a) => a.status === "idle");
  const allDone = agents.every((a) => a.status === "done");
  const hasError = agents.some((a) => a.status === "error");

  // Determine which connections are "active" (data flowing)
  const getConnectionStatus = (fromIdx: number) => {
    const from = agents[fromIdx];
    const to = agents[fromIdx + 1];
    if (!to) return "idle";
    if (from.status === "done" && to.status !== "idle") return "active";
    if (from.status === "done" && to.status === "idle") return "complete";
    return "idle";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="h-full flex flex-col bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden relative"
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30 relative z-10">
        <div className="flex items-center gap-2">
          <Orbit className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            Swarm Arena
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {allIdle
            ? "Launch the swarm to begin planning"
            : allDone
            ? "All agents complete ✓"
            : hasError
            ? "An agent encountered an error"
            : "Agents are working on your plan..."}
        </p>
      </div>

      {/* Arena */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-6">
        <div className="relative w-full max-w-[380px] aspect-square">
          {/* Connection Lines (SVG) */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 380 380"
            fill="none"
          >
            {/* Interpreter → Calculator (top → left) */}
            <motion.path
              d="M190 80 L80 190"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              className={
                getConnectionStatus(0) === "active"
                  ? "text-primary"
                  : getConnectionStatus(0) === "complete"
                  ? "text-emerald-500/50"
                  : "text-border/30"
              }
              animate={
                getConnectionStatus(0) === "active"
                  ? { strokeDashoffset: [0, -20] }
                  : {}
              }
              transition={
                getConnectionStatus(0) === "active"
                  ? { repeat: Infinity, duration: 1, ease: "linear" }
                  : {}
              }
            />

            {/* Calculator → Allocator (left → right) */}
            <motion.path
              d="M80 190 L300 190"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              className={
                getConnectionStatus(1) === "active"
                  ? "text-primary"
                  : getConnectionStatus(1) === "complete"
                  ? "text-emerald-500/50"
                  : "text-border/30"
              }
              animate={
                getConnectionStatus(1) === "active"
                  ? { strokeDashoffset: [0, -20] }
                  : {}
              }
              transition={
                getConnectionStatus(1) === "active"
                  ? { repeat: Infinity, duration: 1, ease: "linear" }
                  : {}
              }
            />

            {/* Allocator → Analyst (right → bottom) */}
            <motion.path
              d="M300 190 L190 300"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              className={
                getConnectionStatus(2) === "active"
                  ? "text-primary"
                  : getConnectionStatus(2) === "complete"
                  ? "text-emerald-500/50"
                  : "text-border/30"
              }
              animate={
                getConnectionStatus(2) === "active"
                  ? { strokeDashoffset: [0, -20] }
                  : {}
              }
              transition={
                getConnectionStatus(2) === "active"
                  ? { repeat: Infinity, duration: 1, ease: "linear" }
                  : {}
              }
            />
          </svg>

          {/* Coordinator Hub (center) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={
                !allIdle && !allDone
                  ? {
                      scale: [1, 1.1, 1],
                      opacity: [0.6, 1, 0.6],
                    }
                  : {}
              }
              transition={
                !allIdle && !allDone
                  ? { repeat: Infinity, duration: 2, ease: "easeInOut" }
                  : {}
              }
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors duration-300 ${
                allDone
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : allIdle
                  ? "border-border/30 bg-card/20"
                  : "border-primary/40 bg-primary/10"
              }`}
            >
              <span
                className={`text-[10px] font-bold ${
                  allDone
                    ? "text-emerald-400"
                    : allIdle
                    ? "text-muted-foreground/40"
                    : "text-primary"
                }`}
              >
                {allDone ? "✓" : "HUB"}
              </span>
            </motion.div>
          </div>

          {/* Agent Nodes in diamond pattern */}
          {/* Top: Goal Interpreter */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            <SwarmNode agent={agents[0]} index={0} />
          </div>

          {/* Left: SIP Calculator */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2">
            <SwarmNode agent={agents[1]} index={1} />
          </div>

          {/* Right: Asset Allocator */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2">
            <SwarmNode agent={agents[2]} index={2} />
          </div>

          {/* Bottom: Market Analyst */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <SwarmNode agent={agents[3]} index={3} />
          </div>
        </div>
      </div>

      {/* Completion badge */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 py-3 border-t border-border/30 text-center"
        >
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            🎯 Plan Complete — See Blueprint →
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
