"use client";

import { useState, useCallback, useRef } from "react";
import {
  AgentStatus,
  AGENT_DEFINITIONS,
  FinalPlan,
  SwarmEvent,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function createInitialAgents(): AgentStatus[] {
  return AGENT_DEFINITIONS.map((def) => ({
    ...def,
    status: "idle" as const,
    thoughts: [],
  }));
}

export interface SwarmOptions {
  initial_capital?: number;
  monthly_income?: number;
  risk_tolerance?: string;
}

export function useSwarm() {
  const [agents, setAgents] = useState<AgentStatus[]>(createInitialAgents());
  const [plan, setPlan] = useState<FinalPlan | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSwarm = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setAgents(createInitialAgents());
    setPlan(null);
    setIsRunning(false);
    setError(null);
  }, []);

  const startSwarm = useCallback(
    (goal: string, options?: SwarmOptions) => {
      // Reset state
      resetSwarm();
      setIsRunning(true);
      setError(null);

      // Build URL with query params
      const params = new URLSearchParams({ goal });
      if (options?.initial_capital != null)
        params.set("initial_capital", String(options.initial_capital));
      if (options?.monthly_income != null)
        params.set("monthly_income", String(options.monthly_income));
      if (options?.risk_tolerance)
        params.set("risk_tolerance", options.risk_tolerance);

      const url = `${API_URL}/api/v1/swarm/plan?${params.toString()}`;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      // 120s timeout
      timeoutRef.current = setTimeout(() => {
        es.close();
        setIsRunning(false);
        setError("Request timed out after 2 minutes. Please try again.");
      }, 120000);

      const handleEvent = (e: MessageEvent) => {
        try {
          const event: SwarmEvent = JSON.parse(e.data);

          setAgents((prev) =>
            prev.map((agent) => {
              if (agent.id === event.agent) {
                if (event.event_type === "thinking") {
                  return {
                    ...agent,
                    status: "thinking",
                    thoughts: [...agent.thoughts, event.content],
                  };
                }
                if (event.event_type === "result") {
                  return { ...agent, status: "done" };
                }
                if (event.event_type === "error") {
                  return {
                    ...agent,
                    status: "error",
                    thoughts: [...agent.thoughts, `❌ ${event.content}`],
                  };
                }
              }
              return agent;
            })
          );

          // Capture final plan from coordinator result
          if (
            event.agent === "coordinator" &&
            event.event_type === "result" &&
            event.data
          ) {
            setPlan(event.data as unknown as FinalPlan);
          }

          // Capture error
          if (event.event_type === "error") {
            setError(event.content);
          }
        } catch {
          // Ignore parse errors on individual events
        }
      };

      // Listen for specific event types
      es.addEventListener("thinking", handleEvent);
      es.addEventListener("result", handleEvent);
      es.addEventListener("error", handleEvent);

      // Done sentinel
      es.addEventListener("done", () => {
        es.close();
        eventSourceRef.current = null;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsRunning(false);
      });

      // Connection error
      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsRunning(false);
        setError("Connection lost. Please check if the backend is running.");
      };
    },
    [resetSwarm]
  );

  return {
    agents,
    plan,
    isRunning,
    error,
    startSwarm,
    resetSwarm,
  };
}
