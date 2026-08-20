"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useSwarm } from "./useSwarm";
import ChatPanel from "./ChatPanel";
import SwarmArena from "./SwarmArena";
import BlueprintPanel from "./BlueprintPanel";
import type { SwarmOptions } from "./useSwarm";

export default function GoalSwarmPage() {
  const { agents, plan, isRunning, error, startSwarm, resetSwarm } =
    useSwarm();

  const handleLaunch = (goal: string, options?: SwarmOptions) => {
    startSwarm(goal, options);
  };

  // Show error toast when error changes
  React.useEffect(() => {
    if (error) {
      toast.error(error, { duration: 5000 });
    }
  }, [error]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(0,0,0,0.85)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            backdropFilter: "blur(12px)",
          },
        }}
      />

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              AI Goal Planner
            </h1>
            <p className="text-sm text-muted-foreground">
              Multi-agent swarm builds your financial plan in real-time
            </p>
          </div>
        </div>
      </motion.div>

      {/* Three-Column Grid */}
      <div className="grid grid-cols-12 gap-5 h-[calc(100vh-12rem)]">
        {/* Left: Chat Panel */}
        <div className="col-span-3">
          <ChatPanel
            onLaunch={handleLaunch}
            onReset={resetSwarm}
            isRunning={isRunning}
            hasPlan={plan !== null}
          />
        </div>

        {/* Center: Swarm Arena */}
        <div className="col-span-5">
          <SwarmArena agents={agents} />
        </div>

        {/* Right: Blueprint Panel */}
        <div className="col-span-4">
          <BlueprintPanel plan={plan} isRunning={isRunning} />
        </div>
      </div>
    </>
  );
}
