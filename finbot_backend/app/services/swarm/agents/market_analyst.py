"""Market Analyst Agent — Selects specific stocks/funds for each allocation slice."""

from __future__ import annotations

import json
import os
from typing import AsyncGenerator

from groq import AsyncGroq

from app.services.swarm.schemas import AssetAllocation, ParsedGoal, StockPick, SwarmEvent

SYSTEM_PROMPT = """You are an Indian market analyst specializing in stock and mutual fund selection.

For each asset allocation slice provided, recommend 2-3 specific instruments available on NSE or through Indian AMCs.

For equity allocations, suggest:
- NSE-listed stocks (use .NS suffix, e.g., RELIANCE.NS) OR
- Index funds / ETFs (e.g., "Nifty 50 Index Fund")

For debt allocations, suggest:
- Debt mutual funds, PPF, or government bonds

For gold allocations, suggest:
- Gold ETFs or Sovereign Gold Bonds (SGBs)

For international equity:
- Funds that invest in US/global markets (e.g., Motilal Oswal Nasdaq 100 ETF)

For each pick provide:
- symbol: NSE symbol or fund identifier
- name: Full name
- asset_class: Which allocation slice it belongs to
- weight: Percentage weight within its asset class (should sum to ~100 per class)
- rationale: Brief reason for selection (1-2 sentences)

Return ONLY a JSON array of pick objects. No markdown, no explanation."""


async def pick_assets(
    allocation: AssetAllocation,
    parsed_goal: ParsedGoal,
) -> AsyncGenerator[SwarmEvent, None]:
    """Select specific stocks and funds for each allocation slice."""

    yield SwarmEvent(
        agent="market_analyst",
        event_type="thinking",
        content="Scanning NSE equity universe and mutual fund database...",
    )

    yield SwarmEvent(
        agent="market_analyst",
        event_type="thinking",
        content="Selecting instruments for each asset class...",
    )

    try:
        client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

        slices_summary = "\n".join(
            f"- {s.asset_class}: {s.percentage}%" for s in allocation.slices
        )
        user_message = (
            f"Asset Allocation:\n{slices_summary}\n\n"
            f"Investor profile: {parsed_goal.risk_tolerance}, "
            f"{parsed_goal.timeline_years}-year horizon, "
            f"target ₹{parsed_goal.target_amount:,.0f}"
        )

        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.5,
            max_completion_tokens=1200,
        )

        raw = response.choices[0].message.content or "[]"
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        picks_data = json.loads(raw)

        if isinstance(picks_data, dict):
            picks_data = picks_data.get("picks", picks_data.get("recommendations", []))

        picks = [StockPick(**p) for p in picks_data]

        yield SwarmEvent(
            agent="market_analyst",
            event_type="thinking",
            content=f"Selected {len(picks)} instruments across {len(allocation.slices)} asset classes",
        )

        yield SwarmEvent(
            agent="market_analyst",
            event_type="result",
            content="Market analysis complete.",
            data={"picks": [p.model_dump() for p in picks]},
        )

    except json.JSONDecodeError as e:
        yield SwarmEvent(
            agent="market_analyst",
            event_type="error",
            content=f"Failed to parse analyst response: {e}",
        )
    except Exception as e:
        yield SwarmEvent(
            agent="market_analyst",
            event_type="error",
            content=f"Market analysis failed: {e}",
        )
