---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Goal Swarm Page Layout & SSE Hook

## Objective
Create the `/dashboard/goal-swarm` page with the three-column layout structure and the custom React hook that connects to the SSE endpoint and manages swarm state.

## Context
- .gsd/SPEC.md
- finbot-frontend/app/dashboard/layout.tsx (dashboard layout pattern)
- finbot-frontend/app/globals.css (design tokens, dark theme)
- finbot-frontend/package.json (framer-motion, recharts already installed)

## Tasks

<task type="auto">
  <name>Create SSE hook and types</name>
  <files>
    finbot-frontend/app/dashboard/goal-swarm/types.ts
    finbot-frontend/app/dashboard/goal-swarm/useSwarm.ts
  </files>
  <action>
    **types.ts**: Define TypeScript interfaces matching backend schemas:
    - `SwarmEvent { agent: string; event_type: "thinking" | "result" | "error"; content: string; data?: any }`
    - `ParsedGoal { target_amount: number; timeline_years: number; initial_capital: number; monthly_income: number; risk_tolerance: string }`
    - `SIPPlan { monthly_sip: number; expected_cagr: number; inflation_rate: number; projected_corpus: number }`
    - `AllocationSlice { asset_class: string; percentage: number; rationale: string }`
    - `StockPick { symbol: string; name: string; asset_class: string; weight: number; rationale: string }`
    - `FinalPlan { goal: ParsedGoal; sip: SIPPlan; allocation: { slices: AllocationSlice[] }; picks: StockPick[]; projected_values: { year: number; value: number }[] }`
    - `AgentStatus { id: string; name: string; status: "idle" | "thinking" | "done" | "error"; thoughts: string[] }`

    **useSwarm.ts**: Custom hook `useSwarm()`:
    - State: `agents: AgentStatus[]` (initialized with 4 agents in "idle" state), `plan: FinalPlan | null`, `isRunning: boolean`, `error: string | null`
    - `startSwarm(goal: string, options?: { initial_capital?, monthly_income?, risk_tolerance? })`:
      1. Reset all agents to "idle", clear plan
      2. Create EventSource to `${BACKEND_URL}/api/v1/swarm/plan?goal=...`
      3. On `thinking` event: update matching agent to "thinking" status, append thought to their thoughts array
      4. On `result` event: update matching agent to "done" status, if agent is "coordinator" set the final plan
      5. On `error` event: update agent to "error", set error state
      6. On `done` event: close EventSource, set isRunning to false
    - `resetSwarm()`: clear all state
    - Return `{ agents, plan, isRunning, error, startSwarm, resetSwarm }`
    - Use `process.env.NEXT_PUBLIC_API_URL` or fallback to `http://localhost:8000` for backend URL
  </action>
  <verify>cd finbot-frontend && npx tsc --noEmit --strict app/dashboard/goal-swarm/types.ts 2>&1 | head -5</verify>
  <done>TypeScript types compile without errors, hook has correct exports</done>
</task>

<task type="auto">
  <name>Create page layout with chat input</name>
  <files>
    finbot-frontend/app/dashboard/goal-swarm/page.tsx
    finbot-frontend/app/dashboard/goal-swarm/ChatPanel.tsx
  </files>
  <action>
    **page.tsx**: "use client" page component with three-column grid:
    ```
    <div className="grid grid-cols-12 gap-6 h-full min-h-[calc(100vh-4rem)]">
      <div className="col-span-3">  <!-- Chat Panel -->
      <div className="col-span-5">  <!-- Swarm Arena (placeholder for now) -->
      <div className="col-span-4">  <!-- Blueprint Panel (placeholder for now) -->
    </div>
    ```
    - Import and use `useSwarm()` hook
    - Pass swarm state to child components
    - Add page title "AI Goal Planner" with a gradient text effect
    - Use glassmorphism card styling: `bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl`

    **ChatPanel.tsx**: Left column component:
    - Text input (textarea) with placeholder "Describe your financial goal..."
    - Example prompts as clickable chips: "₹2 Crores retirement in 15 years", "₹50L house in 5 years", "₹1 Crore child education in 10 years"
    - Optional fields (collapsible): initial capital, monthly income, risk tolerance dropdown
    - "Launch Swarm" button with gradient (primary→chart-4 gradient), disabled while running
    - Show running status with a pulsing dot animation
    - Use framer-motion for entry animations (fade-in-up on mount)
    - Styling: dark glassmorphism card, Inter font feel
  </action>
  <verify>cd finbot-frontend && npx tsc --noEmit app/dashboard/goal-swarm/page.tsx 2>&1 | head -10</verify>
  <done>Page renders with three-column layout. Chat panel has input, example chips, and launch button.</done>
</task>

## Success Criteria
- [ ] `/dashboard/goal-swarm` page loads with three-column layout
- [ ] Chat panel has text input, example prompts, and launch button
- [ ] useSwarm hook connects to SSE and updates agent states
- [ ] All TypeScript compiles without errors
