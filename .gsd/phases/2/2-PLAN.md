---
phase: 2
plan: 2
wave: 2
---

# Plan 2.2: Swarm Arena — Agent Node Visualization

## Objective
Build the SwarmArena center panel with animated agent nodes that pulse, glow, and show live thought logs as the swarm processes.

## Context
- .gsd/SPEC.md
- finbot-frontend/app/dashboard/goal-swarm/types.ts (AgentStatus type)
- finbot-frontend/package.json (framer-motion already installed)

## Tasks

<task type="auto">
  <name>Build SwarmNode component</name>
  <files>
    finbot-frontend/app/dashboard/goal-swarm/SwarmNode.tsx
  </files>
  <action>
    Create `SwarmNode.tsx` — a Framer Motion animated component for a single agent:

    Props: `{ agent: AgentStatus, index: number }`

    Visual design:
    - Circular node (80x80px) with agent icon in center (use lucide icons: Brain for Interpreter, Calculator for SIP, PieChart for Allocator, TrendingUp for Analyst)
    - Agent name below the circle
    - Status-based styling:
      - `idle`: dim, muted border (border-border/30), low opacity
      - `thinking`: pulsing glow animation (box-shadow with primary color), scale pulse 1.0→1.05, rotating gradient border
      - `done`: solid green glow (chart-3 color), checkmark overlay
      - `error`: red glow (destructive color), X overlay
    - Thought bubble: when thinking, show latest thought in a speech-bubble div below the node
      - Use `AnimatePresence` for thought transitions (slide-up, fade)
      - Show max 2 most recent thoughts, older ones fade out
    - Use `motion.div` with `animate` based on status
    - Staggered entry animation based on index (delay = index * 0.15s)
  </action>
  <verify>cd finbot-frontend && npx tsc --noEmit app/dashboard/goal-swarm/SwarmNode.tsx 2>&1 | head -5</verify>
  <done>SwarmNode renders with status-based animations and thought bubbles</done>
</task>

<task type="auto">
  <name>Build SwarmArena component</name>
  <files>
    finbot-frontend/app/dashboard/goal-swarm/SwarmArena.tsx
  </files>
  <action>
    Create `SwarmArena.tsx` — the center panel managing all agent nodes:

    Props: `{ agents: AgentStatus[] }`

    Layout:
    - Arrange 4 SwarmNodes in a diamond/cross pattern within the panel:
      ```
           [Interpreter]
      [Calculator]    [Allocator]
           [Analyst]
      ```
    - Use CSS grid or absolute positioning within a relative container
    - Draw animated connection lines between nodes using SVG paths:
      - Lines light up (stroke transition from muted to primary) as data flows from one agent to the next
      - Use dashed lines that animate (stroke-dashoffset) when data is transferring
    - Center "Coordinator" label/badge in the middle of the diamond with a brain icon
    - Background: subtle grid pattern or dot pattern for the "arena" feel (CSS background-image with radial-gradient dots)
    - Overall glassmorphism card wrapper

    States:
    - Before launch: all nodes idle, arena shows "Launch swarm to begin" in muted text
    - During execution: active node pulses, connection lines animate sequentially
    - After completion: all nodes green, "Plan Complete ✓" badge appears in center
  </action>
  <verify>cd finbot-frontend && npx tsc --noEmit app/dashboard/goal-swarm/SwarmArena.tsx 2>&1 | head -5</verify>
  <done>SwarmArena renders 4 nodes in diamond layout with animated connections</done>
</task>

## Success Criteria
- [ ] Agent nodes animate based on status (idle → thinking → done)
- [ ] Thought bubbles show live agent thoughts with smooth transitions
- [ ] Connection lines between nodes animate as data flows
- [ ] Arena has premium dark aesthetic with glassmorphism and grid background
