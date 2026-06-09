"""Asset Allocator Agent — Determines optimal asset class mix based on risk and timeline."""

from __future__ import annotations

import json
import os
from typing import AsyncGenerator

from groq import AsyncGroq

from app.services.swarm.schemas import AllocationSlice, AssetAllocation, ParsedGoal, SwarmEvent

SYSTEM_PROMPT = """You are an asset allocation strategist for Indian investors.

Given a financial goal with a specific timeline and risk tolerance, suggest an optimal asset allocation.

Use these asset classes (pick the relevant ones):
- Large Cap Equity (Nifty 50 / Blue chips)
- Mid Cap Equity (Nifty Midcap 150)
- Small Cap Equity (High growth, high risk)
- International Equity (US/Global diversification)
- Debt / Fixed Income (Bonds, FDs, PPF)
- Gold / Commodities (Hedge against inflation)
- REITs (Real estate exposure)

Rules:
- Percentages must sum to exactly 100
- Shorter timelines → more debt, less equity
- Conservative → max 40% equity, Aggressive → up to 85% equity  
- Always include at least one debt component for safety
- Always include rationale for each allocation

Return ONLY a JSON array of objects with fields: asset_class, percentage, rationale.
No markdown, no explanation outside the JSON."""


async def allocate_assets(parsed_goal: ParsedGoal) -> AsyncGenerator[SwarmEvent, None]:
    """Determine asset allocation based on risk profile and timeline."""

    yield SwarmEvent(
        agent="asset_allocator",
        event_type="thinking",
        content="Evaluating risk profile and investment horizon...",
    )

    yield SwarmEvent(
        agent="asset_allocator",
        event_type="thinking",
        content=f"Designing allocation for {parsed_goal.risk_tolerance} investor with {parsed_goal.timeline_years}-year horizon...",
    )

    try:
        client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

        user_message = (
            f"Timeline: {parsed_goal.timeline_years} years\n"
            f"Risk tolerance: {parsed_goal.risk_tolerance}\n"
            f"Target: ₹{parsed_goal.target_amount:,.0f}\n"
            f"Goal: {parsed_goal.goal_summary}"
        )

        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.4,
            max_completion_tokens=800,
        )

        raw = response.choices[0].message.content or "[]"
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        slices_data = json.loads(raw)

        # Handle both array and object-with-array responses
        if isinstance(slices_data, dict):
            slices_data = slices_data.get("allocation", slices_data.get("slices", []))

        slices = [AllocationSlice(**s) for s in slices_data]

        # Validate percentages sum to ~100
        total = sum(s.percentage for s in slices)
        if abs(total - 100) > 2:
            # Normalize
            for s in slices:
                s.percentage = round(s.percentage * 100 / total, 1)

        allocation = AssetAllocation(slices=slices)

        summary = ", ".join(f"{s.asset_class}: {s.percentage}%" for s in slices)
        yield SwarmEvent(
            agent="asset_allocator",
            event_type="thinking",
            content=f"Allocation strategy: {summary}",
        )

        yield SwarmEvent(
            agent="asset_allocator",
            event_type="result",
            content="Asset allocation complete.",
            data=allocation.model_dump(),
        )

    except json.JSONDecodeError as e:
        yield SwarmEvent(
            agent="asset_allocator",
            event_type="error",
            content=f"Failed to parse allocation response: {e}",
        )
    except Exception as e:
        yield SwarmEvent(
            agent="asset_allocator",
            event_type="error",
            content=f"Asset allocation failed: {e}",
        )
