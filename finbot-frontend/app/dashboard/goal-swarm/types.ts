// TypeScript types for the Swarm Goal Planner — mirrors backend Pydantic schemas

export type EventType = "thinking" | "result" | "error";

export interface SwarmEvent {
  agent: string;
  event_type: EventType;
  content: string;
  data?: Record<string, unknown>;
}

export interface ParsedGoal {
  target_amount: number;
  timeline_years: number;
  initial_capital: number;
  monthly_income: number;
  risk_tolerance: string;
  goal_summary: string;
}

export interface SIPPlan {
  monthly_sip: number;
  expected_cagr: number;
  inflation_rate: number;
  projected_corpus: number;
}

export interface AllocationSlice {
  asset_class: string;
  percentage: number;
  rationale: string;
}

export interface AssetAllocation {
  slices: AllocationSlice[];
}

export interface StockPick {
  symbol: string;
  name: string;
  asset_class: string;
  weight: number;
  rationale: string;
}

export interface ProjectedValue {
  year: number;
  value: number;
}

export interface FinalPlan {
  goal: ParsedGoal;
  sip: SIPPlan;
  allocation: AssetAllocation;
  picks: StockPick[];
  projected_values: ProjectedValue[];
}

export type AgentStatusType = "idle" | "thinking" | "done" | "error";

export interface AgentStatus {
  id: string;
  name: string;
  status: AgentStatusType;
  thoughts: string[];
}

export const AGENT_DEFINITIONS: Omit<AgentStatus, "status" | "thoughts">[] = [
  { id: "goal_interpreter", name: "Goal Interpreter" },
  { id: "sip_calculator", name: "SIP Calculator" },
  { id: "asset_allocator", name: "Asset Allocator" },
  { id: "market_analyst", name: "Market Analyst" },
];
