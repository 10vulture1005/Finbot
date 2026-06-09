"""Swarm Coordinator — Orchestrates the sequential agent pipeline."""

from __future__ import annotations

from typing import AsyncGenerator

from app.services.swarm.agents.asset_allocator import allocate_assets
from app.services.swarm.agents.goal_interpreter import interpret_goal
from app.services.swarm.agents.market_analyst import pick_assets
from app.services.swarm.agents.sip_calculator import calculate_sip
from app.services.swarm.schemas import (
    AssetAllocation,
    FinalPlan,
    GoalInput,
    ParsedGoal,
    ProjectedValue,
    SIPPlan,
    StockPick,
    SwarmEvent,
)


async def run_swarm(goal_input: GoalInput) -> AsyncGenerator[SwarmEvent, None]:
    """
    Run the full swarm pipeline: Interpret → Calculate SIP → Allocate → Pick Assets.

    Yields SwarmEvent objects as each agent thinks and produces results.
    The final event contains the complete FinalPlan.
    """

    yield SwarmEvent(
        agent="coordinator",
        event_type="thinking",
        content="Initializing swarm agents for your financial plan...",
    )

    # ── Stage 1: Goal Interpreter ────────────────────────────────────
    parsed_goal: ParsedGoal | None = None

    async for event in interpret_goal(goal_input):
        yield event
        if event.event_type == "result" and event.data:
            parsed_goal = ParsedGoal(**event.data)
        elif event.event_type == "error":
            return  # Stop pipeline on error

    if parsed_goal is None:
        yield SwarmEvent(
            agent="coordinator",
            event_type="error",
            content="Goal interpreter did not return a result.",
        )
        return

    # ── Stage 2: SIP Calculator ──────────────────────────────────────
    sip_plan: SIPPlan | None = None
    projected_values: list[ProjectedValue] = []

    async for event in calculate_sip(parsed_goal):
        yield event
        if event.event_type == "result" and event.data:
            sip_plan = SIPPlan(**event.data["sip"])
            projected_values = [
                ProjectedValue(**pv) for pv in event.data.get("projected_values", [])
            ]
        elif event.event_type == "error":
            return

    if sip_plan is None:
        yield SwarmEvent(
            agent="coordinator",
            event_type="error",
            content="SIP calculator did not return a result.",
        )
        return

    # ── Stage 3: Asset Allocator ─────────────────────────────────────
    allocation: AssetAllocation | None = None

    async for event in allocate_assets(parsed_goal):
        yield event
        if event.event_type == "result" and event.data:
            allocation = AssetAllocation(**event.data)
        elif event.event_type == "error":
            return

    if allocation is None:
        yield SwarmEvent(
            agent="coordinator",
            event_type="error",
            content="Asset allocator did not return a result.",
        )
        return

    # ── Stage 4: Market Analyst ──────────────────────────────────────
    stock_picks: list[StockPick] = []

    async for event in pick_assets(allocation, parsed_goal):
        yield event
        if event.event_type == "result" and event.data:
            stock_picks = [StockPick(**p) for p in event.data.get("picks", [])]
        elif event.event_type == "error":
            return

    # ── Assemble Final Plan ──────────────────────────────────────────
    final_plan = FinalPlan(
        goal=parsed_goal,
        sip=sip_plan,
        allocation=allocation,
        picks=stock_picks,
        projected_values=projected_values,
    )

    yield SwarmEvent(
        agent="coordinator",
        event_type="thinking",
        content="All agents complete. Assembling your financial plan...",
    )

    yield SwarmEvent(
        agent="coordinator",
        event_type="result",
        content="Your financial plan is ready!",
        data=final_plan.model_dump(),
    )
