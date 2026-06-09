---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Blueprint Panel — Plan Output & Charts

## Objective
Build the BlueprintPanel (right column) that live-fills with the structured financial plan as agents complete. Includes SIP summary cards, allocation pie chart, specific picks list, and projected wealth growth curve.

## Context
- .gsd/SPEC.md
- finbot-frontend/app/dashboard/goal-swarm/types.ts (FinalPlan, SIPPlan, etc.)
- finbot-frontend/package.json (recharts already installed)
- finbot-frontend/app/globals.css (chart-1 through chart-5 colors)

## Tasks

<task type="auto">
  <name>Build BlueprintPanel with sub-sections</name>
  <files>
    finbot-frontend/app/dashboard/goal-swarm/BlueprintPanel.tsx
  </files>
  <action>
    Create `BlueprintPanel.tsx`:

    Props: `{ plan: FinalPlan | null, isRunning: boolean }`

    **Before plan arrives** (isRunning or no plan):
    - Show skeleton loaders with shimmer animation for each section
    - Sections appear as glassmorphism card outlines with pulsing placeholder blocks

    **After plan arrives**, render 4 sections with staggered reveal (framer-motion):

    **Section 1 — Goal Summary** (appears when goal interpreter completes):
    - Grid of stat cards: Target Amount (₹ formatted), Timeline, Risk Profile, Initial Capital
    - Each stat card: glassmorphism mini-card with icon, label, and large formatted value
    - Number count-up animation on values (use framer-motion `animate` with `useMotionValue`)

    **Section 2 — SIP Breakdown** (appears when SIP calculator completes):
    - Large hero stat: "₹{monthly_sip}/month" with gradient text
    - Sub-stats row: Expected CAGR, Inflation-adjusted return, Projected Corpus
    - Small callout badge: "Start today to reach your goal"

    **Section 3 — Asset Allocation Chart** (appears when allocator completes):
    - Recharts PieChart with custom colors from CSS vars (chart-1 through chart-5)
    - Custom tooltip showing rationale for each slice
    - Legend below chart with colored dots and percentages
    - Donut style (innerRadius={60}) with center text showing total value

    **Section 4 — Recommended Picks** (appears when analyst completes):
    - Card list of StockPick items, grouped by asset_class
    - Each pick card: symbol badge, name, weight %, brief rationale
    - Subtle hover effect (scale 1.02, border glow)

    **Section 5 — Wealth Projection Curve** (appears with final plan):
    - Recharts AreaChart showing projected_values (year vs value)
    - Gradient fill under the curve (primary → transparent)
    - Custom tooltip with ₹ formatted values
    - Y-axis with ₹ lakhs/crores formatter
    - Horizontal reference line at target_amount

    Styling: All sections use glassmorphism cards (`bg-card/20 backdrop-blur-lg border border-border/30 rounded-xl p-4`)
    Scroll: The right panel should be independently scrollable
  </action>
  <verify>cd finbot-frontend && npx tsc --noEmit app/dashboard/goal-swarm/BlueprintPanel.tsx 2>&1 | head -10</verify>
  <done>BlueprintPanel renders all 5 sections with charts, animations, and glassmorphism styling</done>
</task>

## Success Criteria
- [ ] Blueprint panel shows skeleton loaders while swarm runs
- [ ] Each section reveals with staggered animation as agents complete
- [ ] Allocation pie chart renders with proper colors and tooltips
- [ ] Wealth projection area chart renders with gradient fill
- [ ] All values are properly ₹-formatted (lakhs/crores)
