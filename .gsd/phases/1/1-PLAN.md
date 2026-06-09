---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Swarm Agent Modules

## Objective
Create the 4 specialized swarm agents and the coordinator module. Each agent receives a state dict, calls Groq, and returns structured output + a stream of thought events.

## Context
- .gsd/SPEC.md
- finbot_backend/requirements.txt (groq already present)
- finbot_backend/app/services/ (existing service pattern)

## Tasks

<task type="auto">
  <name>Create swarm package structure</name>
  <files>
    finbot_backend/app/services/swarm/__init__.py
    finbot_backend/app/services/swarm/schemas.py
  </files>
  <action>
    1. Create `finbot_backend/app/services/swarm/__init__.py` (empty)
    2. Create `finbot_backend/app/services/swarm/schemas.py` with Pydantic models:
       - `SwarmEvent(agent: str, event_type: Literal["thinking","result","error"], content: str, data: dict | None)`
       - `GoalInput(goal: str, initial_capital: float | None, monthly_income: float | None, risk_tolerance: Literal["conservative","moderate","aggressive"] | None)`
       - `ParsedGoal(target_amount: float, timeline_years: int, initial_capital: float, monthly_income: float, risk_tolerance: str)`
       - `SIPPlan(monthly_sip: float, expected_cagr: float, inflation_rate: float, projected_corpus: float)`
       - `AllocationSlice(asset_class: str, percentage: float, rationale: str)`
       - `AssetAllocation(slices: list[AllocationSlice])`
       - `StockPick(symbol: str, name: str, asset_class: str, weight: float, rationale: str)`
       - `FinalPlan(goal: ParsedGoal, sip: SIPPlan, allocation: AssetAllocation, picks: list[StockPick], projected_values: list[dict])`
    - Use Pydantic v2 syntax (model_config, etc.)
  </action>
  <verify>cd finbot_backend && python -c "from app.services.swarm.schemas import SwarmEvent, GoalInput, FinalPlan; print('Schema imports OK')"</verify>
  <done>All Pydantic models import without errors</done>
</task>

<task type="auto">
  <name>Implement specialized agents</name>
  <files>
    finbot_backend/app/services/swarm/agents/__init__.py
    finbot_backend/app/services/swarm/agents/goal_interpreter.py
    finbot_backend/app/services/swarm/agents/sip_calculator.py
    finbot_backend/app/services/swarm/agents/asset_allocator.py
    finbot_backend/app/services/swarm/agents/market_analyst.py
  </files>
  <action>
    Each agent is an async function that:
    1. Yields `SwarmEvent(event_type="thinking", ...)` messages as it works
    2. Calls Groq API with a system prompt specific to its role
    3. Parses the LLM JSON response into its output schema
    4. Yields a final `SwarmEvent(event_type="result", data=...)` with structured data

    **goal_interpreter.py**: `async def interpret_goal(goal_input: GoalInput) -> AsyncGenerator[SwarmEvent, None]`
    - System prompt: "You are a financial goal interpreter. Extract: target_amount, timeline_years, initial_capital, monthly_income, risk_tolerance from the user's goal. Return JSON."
    - Yield thinking: "Analyzing your financial goal...", "Extracting target amount and timeline..."
    - Parse LLM response into ParsedGoal

    **sip_calculator.py**: `async def calculate_sip(parsed_goal: ParsedGoal) -> AsyncGenerator[SwarmEvent, None]`
    - Pure math (no LLM needed): FV = SIP × [((1+r)^n - 1) / r] × (1+r)
    - Yield thinking: "Computing required monthly SIP...", "Adjusting for 6% inflation..."
    - Calculate monthly_sip, projected_corpus, and year-by-year projected_values list

    **asset_allocator.py**: `async def allocate_assets(parsed_goal: ParsedGoal) -> AsyncGenerator[SwarmEvent, None]`
    - System prompt: "You are an asset allocation strategist. Given timeline={years}, risk={risk}, suggest asset allocation. Return JSON array of {asset_class, percentage, rationale}."
    - Yield thinking: "Evaluating risk profile...", "Designing allocation strategy..."
    - Parse into AssetAllocation

    **market_analyst.py**: `async def pick_assets(allocation: AssetAllocation, parsed_goal: ParsedGoal) -> AsyncGenerator[SwarmEvent, None]`
    - System prompt: "You are an Indian market analyst. For each allocation slice, suggest 2-3 specific NSE stocks or mutual funds. Return JSON."
    - Yield thinking: "Scanning NSE equity universe...", "Selecting debt instruments..."
    - Parse into list[StockPick]

    Use `groq.AsyncGroq` client. Import API key from env via `os.getenv("GROQ_API_KEY")`.
    Use `json.loads()` to parse LLM output. Wrap in try/except and yield error events on failure.
  </action>
  <verify>cd finbot_backend && python -c "from app.services.swarm.agents.goal_interpreter import interpret_goal; from app.services.swarm.agents.sip_calculator import calculate_sip; from app.services.swarm.agents.asset_allocator import allocate_assets; from app.services.swarm.agents.market_analyst import pick_assets; print('All agents import OK')"</verify>
  <done>All 4 agent modules import cleanly with correct function signatures</done>
</task>

<task type="auto">
  <name>Implement coordinator</name>
  <files>
    finbot_backend/app/services/swarm/coordinator.py
  </files>
  <action>
    Create `coordinator.py` with:
    ```python
    async def run_swarm(goal_input: GoalInput) -> AsyncGenerator[SwarmEvent, None]:
    ```
    The coordinator:
    1. Yields a "coordinator" thinking event: "Initializing swarm agents..."
    2. Runs `interpret_goal(goal_input)` — yields all its events, captures ParsedGoal from result
    3. Runs `calculate_sip(parsed_goal)` — yields events, captures SIPPlan
    4. Runs `allocate_assets(parsed_goal)` — yields events, captures AssetAllocation
    5. Runs `pick_assets(allocation, parsed_goal)` — yields events, captures picks
    6. Assembles FinalPlan and yields a final "coordinator" result event with the complete plan

    Each step is sequential (agents depend on prior outputs).
    If any agent yields an error event, the coordinator yields it and stops.
  </action>
  <verify>cd finbot_backend && python -c "from app.services.swarm.coordinator import run_swarm; print('Coordinator import OK')"</verify>
  <done>Coordinator imports cleanly and has correct AsyncGenerator signature</done>
</task>

## Success Criteria
- [ ] All schema models are valid Pydantic v2 models
- [ ] All 4 agents import and have correct async generator signatures
- [ ] Coordinator chains agents sequentially and yields SwarmEvent stream
