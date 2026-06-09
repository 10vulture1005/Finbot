---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Sidebar Integration, Error Handling & Build Verification

## Objective
Add the "AI Goal Planner" navigation link to the Sidebar, implement error handling for edge cases, and verify the complete build passes.

## Context
- .gsd/SPEC.md
- finbot-frontend/components/Sidebar.tsx (existing nav items array)
- finbot-frontend/app/dashboard/goal-swarm/page.tsx

## Tasks

<task type="auto">
  <name>Add sidebar navigation link</name>
  <files>
    finbot-frontend/components/Sidebar.tsx
  </files>
  <action>
    1. Add `Target` to the lucide-react import (for the Goal Planner icon)
    2. Add a new entry to `navItems` array after "Groq Chat":
       ```typescript
       { label: "Goal Planner", href: "/dashboard/goal-swarm", icon: Target },
       ```
    3. Do NOT modify any existing nav items or other code in the file
  </action>
  <verify>cd finbot-frontend && grep -n "goal-swarm" components/Sidebar.tsx</verify>
  <done>Sidebar shows "Goal Planner" link pointing to /dashboard/goal-swarm</done>
</task>

<task type="auto">
  <name>Add error handling and loading states</name>
  <files>
    finbot-frontend/app/dashboard/goal-swarm/page.tsx
  </files>
  <action>
    Update page.tsx to handle:
    1. Empty input: disable launch button when input is empty, show helper text
    2. SSE connection error: show error toast (use sonner, already installed) and set error state
    3. Agent error: show error state on the failed agent node with error message
    4. Network timeout: add 120s timeout on the EventSource, auto-close and show timeout message
    5. Reset functionality: "Try Again" button that calls resetSwarm() and clears input

    Also add:
    - Page metadata (title): "AI Goal Planner | Finbot"
    - Loading skeleton for initial page load
  </action>
  <verify>cd finbot-frontend && npx tsc --noEmit app/dashboard/goal-swarm/page.tsx 2>&1 | head -10</verify>
  <done>Error states are handled gracefully, loading states present, page has proper metadata</done>
</task>

<task type="auto">
  <name>Verify build passes</name>
  <files>
    finbot-frontend/
  </files>
  <action>
    Run the Next.js production build to verify everything compiles:
    ```bash
    cd finbot-frontend && npm run build
    ```
    Fix any TypeScript or build errors that arise.
  </action>
  <verify>cd finbot-frontend && npm run build 2>&1 | tail -5</verify>
  <done>Build completes successfully with no errors</done>
</task>

## Success Criteria
- [ ] Sidebar shows "Goal Planner" link with Target icon
- [ ] Empty input is handled (button disabled, helper text)
- [ ] SSE errors show user-friendly error messages
- [ ] `npm run build` passes without errors
