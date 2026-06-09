"""SIP Calculator Agent — Computes required monthly SIP using compound growth math."""

from __future__ import annotations

import asyncio
from typing import AsyncGenerator

from app.services.swarm.schemas import ParsedGoal, ProjectedValue, SIPPlan, SwarmEvent

# Expected CAGR by risk profile (post-tax, realistic Indian market estimates)
CAGR_MAP = {
    "conservative": 0.09,   # ~9% — debt-heavy mix
    "moderate": 0.12,       # ~12% — balanced equity/debt
    "aggressive": 0.15,     # ~15% — equity-heavy
}

INFLATION_RATE = 0.06  # 6% assumed inflation


async def calculate_sip(parsed_goal: ParsedGoal) -> AsyncGenerator[SwarmEvent, None]:
    """Calculate required monthly SIP and year-by-year projections."""

    yield SwarmEvent(
        agent="sip_calculator",
        event_type="thinking",
        content="Computing required monthly SIP...",
    )

    # Small delay to make the streaming feel natural
    await asyncio.sleep(0.3)

    try:
        cagr = CAGR_MAP.get(parsed_goal.risk_tolerance, CAGR_MAP["moderate"])
        target = parsed_goal.target_amount
        years = parsed_goal.timeline_years
        initial = parsed_goal.initial_capital

        yield SwarmEvent(
            agent="sip_calculator",
            event_type="thinking",
            content=f"Using expected CAGR of {cagr*100:.0f}% for {parsed_goal.risk_tolerance} profile",
        )

        await asyncio.sleep(0.3)

        yield SwarmEvent(
            agent="sip_calculator",
            event_type="thinking",
            content=f"Adjusting for {INFLATION_RATE*100:.0f}% inflation...",
        )

        await asyncio.sleep(0.2)

        # Monthly rate
        monthly_rate = cagr / 12
        n_months = years * 12

        # Future value of initial lump sum
        fv_lumpsum = initial * ((1 + cagr) ** years) if initial > 0 else 0

        # Remaining target after lump sum growth
        remaining_target = max(target - fv_lumpsum, 0)

        # SIP formula: FV = SIP × [((1+r)^n - 1) / r] × (1+r)
        # Solving for SIP: SIP = FV / [((1+r)^n - 1) / r × (1+r)]
        if remaining_target > 0 and n_months > 0:
            factor = (((1 + monthly_rate) ** n_months) - 1) / monthly_rate
            factor *= (1 + monthly_rate)
            monthly_sip = remaining_target / factor
        else:
            monthly_sip = 0

        # Year-by-year projection
        projected_values: list[ProjectedValue] = [
            ProjectedValue(year=0, value=initial)
        ]

        cumulative = initial
        for yr in range(1, years + 1):
            # Lump sum growth for this year
            lump_growth = initial * ((1 + cagr) ** yr)
            # SIP accumulation up to this year
            months_so_far = yr * 12
            if monthly_rate > 0:
                sip_growth = monthly_sip * (
                    (((1 + monthly_rate) ** months_so_far) - 1) / monthly_rate
                ) * (1 + monthly_rate)
            else:
                sip_growth = monthly_sip * months_so_far
            cumulative = lump_growth + sip_growth
            projected_values.append(ProjectedValue(year=yr, value=round(cumulative, 2)))

        sip_plan = SIPPlan(
            monthly_sip=round(monthly_sip, 2),
            expected_cagr=cagr,
            inflation_rate=INFLATION_RATE,
            projected_corpus=round(cumulative, 2),
        )

        yield SwarmEvent(
            agent="sip_calculator",
            event_type="thinking",
            content=f"Required SIP: ₹{monthly_sip:,.0f}/month to reach ₹{target:,.0f} in {years} years",
        )

        yield SwarmEvent(
            agent="sip_calculator",
            event_type="result",
            content="SIP calculation complete.",
            data={
                "sip": sip_plan.model_dump(),
                "projected_values": [pv.model_dump() for pv in projected_values],
            },
        )

    except Exception as e:
        yield SwarmEvent(
            agent="sip_calculator",
            event_type="error",
            content=f"SIP calculation failed: {e}",
        )
