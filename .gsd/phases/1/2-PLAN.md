---
phase: 1
plan: 2
wave: 2
---

# Plan 1.2: SSE Streaming Endpoint

## Objective
Create the FastAPI SSE endpoint that exposes the swarm coordinator's event stream to the frontend, and register it in the API router.

## Context
- .gsd/SPEC.md
- finbot_backend/app/api/v1/router.py (existing router pattern)
- finbot_backend/main.py (FastAPI app)
- finbot_backend/app/services/swarm/coordinator.py (from Plan 1.1)

## Tasks

<task type="auto">
  <name>Create swarm API route</name>
  <files>
    finbot_backend/app/api/v1/swarm.py
  </files>
  <action>
    Create `swarm.py` with:
    1. `GET /swarm/plan` endpoint that accepts query param `goal: str` (required)
    2. Optional query params: `initial_capital: float = None`, `monthly_income: float = None`, `risk_tolerance: str = None`
    3. Returns `StreamingResponse(media_type="text/event-stream")`
    4. The generator function:
       - Creates `GoalInput` from query params
       - Iterates over `run_swarm(goal_input)`
       - For each `SwarmEvent`, formats as SSE: `data: {json}\n\n`
       - Adds `event: {event_type}` field for frontend EventSource filtering
       - Sends a final `event: done\ndata: {}\n\n` sentinel
    5. Add CORS headers for SSE: `Cache-Control: no-cache`, `Connection: keep-alive`

    SSE format per event:
    ```
    event: {event.event_type}
    data: {"agent": "...", "content": "...", "data": {...}}\n\n
    ```
  </action>
  <verify>cd finbot_backend && python -c "from app.api.v1.swarm import router; print('Swarm router import OK')"</verify>
  <done>Swarm router imports cleanly and has GET /swarm/plan endpoint</done>
</task>

<task type="auto">
  <name>Register swarm router in API</name>
  <files>
    finbot_backend/app/api/v1/router.py
  </files>
  <action>
    1. Import swarm module: `from app.api.v1 import swarm`
    2. Add: `router.include_router(swarm.router, tags=["Swarm"])`
    - Place after existing router includes
    - Do NOT modify any existing imports or includes
  </action>
  <verify>cd finbot_backend && python -c "from app.api.v1.router import router; routes = [r.path for r in router.routes]; assert '/swarm/plan' in routes or any('swarm' in str(r) for r in routes); print('Router registered OK')"</verify>
  <done>Swarm router is included in the main v1 router</done>
</task>

## Success Criteria
- [ ] `GET /api/v1/swarm/plan?goal=...` endpoint exists and returns SSE stream
- [ ] SSE events follow proper format with event type and JSON data
- [ ] Swarm router is registered in the main API router
