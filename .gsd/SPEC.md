# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Build a **Swarm Goal Planner** — a multi-agent AI system where specialized agents (Goal Interpreter, SIP Calculator, Asset Allocator, Market Analyst) collaborate in real-time to create a comprehensive financial plan from a single user prompt. The frontend will visualize the swarm's live thought process via a premium, animated UI with a Swarm Arena (agent nodes pulsing as they work), a chat input, and a live-updating Blueprint panel showing the final plan.

## Goals
1. **Backend Swarm Engine** — Build a coordinator + 4 specialized agents that stream their "thoughts" via SSE to the frontend.
2. **Premium UI Section** — Create a stunning `/dashboard/goal-swarm` page with a three-column layout (Chat → Swarm Arena → Blueprint) using Framer Motion animations and glassmorphism.
3. **End-to-End Flow** — A user types a goal prompt, the swarm activates sequentially, and a complete financial plan (SIP amount, allocation breakdown, specific fund/stock picks, projected growth chart) renders live.

## Non-Goals (Out of Scope)
- Actual trade execution or brokerage integration
- Persistent goal tracking / SIP logging (that's idea.md #3, separate feature)
- Mobile-specific responsive tweaks (desktop-first for this phase)
- User authentication changes (reuse existing JWT auth)

## Users
Finbot users who want AI-powered financial goal planning — they type a natural-language goal like "I want ₹2 Crores for retirement in 15 years" and get a structured, visual financial plan.

## Constraints
- **LLM**: Use Groq (already in requirements.txt) for fast inference
- **Frontend**: Next.js 16 + Tailwind v4 + Framer Motion (already installed)
- **Backend**: FastAPI + SSE streaming (no WebSocket needed — SSE is simpler and sufficient)
- **Charts**: Recharts (already installed in frontend)
- **No new DB models** — the swarm is stateless per request (plan is returned, not persisted)

## Success Criteria
- [ ] User can type a goal prompt and see agents activate visually in sequence
- [ ] Each agent's "thought log" streams to the UI in real-time
- [ ] Final plan includes: target amount, monthly SIP, asset allocation pie chart, specific picks, projected wealth curve
- [ ] The page looks premium — glassmorphism cards, pulsing nodes, smooth transitions
- [ ] SSE endpoint streams structured events with agent name, status, and content
