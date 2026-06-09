# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: Swarm Goal Planner v1.0

## Must-Haves (from SPEC)
- [ ] SSE streaming endpoint for swarm agent events
- [ ] Coordinator + 4 specialized agents (Interpreter, Calculator, Allocator, Analyst)
- [ ] Premium `/dashboard/goal-swarm` page with 3-column layout
- [ ] Live agent visualization with pulsing nodes and thought logs
- [ ] Blueprint panel with allocation chart and projected growth curve

## Phases

### Phase 1: Backend Swarm Engine
**Status**: ⬜ Not Started
**Objective**: Build the swarm coordinator, all 4 specialized agents, and the SSE streaming endpoint. By the end of this phase, `GET /api/v1/swarm/plan?goal=...` returns a streaming SSE response with structured agent events.
**Requirements**: REQ-01 (SSE endpoint), REQ-02 (Agent pipeline)

### Phase 2: Swarm Arena UI — Agent Visualization
**Status**: ⬜ Not Started
**Objective**: Build the `/dashboard/goal-swarm` page layout, the SwarmNode and SwarmArena components that visualize the agents as glowing, animated nodes, and the chat input panel. Wire up to the SSE endpoint so agent thoughts stream live.
**Requirements**: REQ-03 (UI layout), REQ-04 (Agent visualization)

### Phase 3: Blueprint Panel & Polish
**Status**: ⬜ Not Started
**Objective**: Build the BlueprintPanel that fills in live as the swarm works — SIP breakdown, allocation pie chart (Recharts), projected wealth growth curve, specific pick cards. Add micro-animations, skeleton loaders, and final polish.
**Requirements**: REQ-05 (Blueprint panel), REQ-06 (Charts), REQ-07 (Polish)

### Phase 4: Integration, Sidebar & Verification
**Status**: ⬜ Not Started
**Objective**: Add the "AI Goal Planner" link to the Sidebar, wire error handling for edge cases (empty input, LLM failures), verify the full end-to-end flow, and ensure the build passes.
**Requirements**: REQ-08 (Integration), REQ-09 (Error handling)
