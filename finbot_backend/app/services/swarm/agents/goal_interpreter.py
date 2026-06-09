"""Goal Interpreter Agent — Extracts structured goal parameters from natural language."""

from __future__ import annotations

import json
import os
from typing import AsyncGenerator

from groq import AsyncGroq

from app.services.swarm.schemas import GoalInput, ParsedGoal, SwarmEvent

SYSTEM_PROMPT = """You are a financial goal interpreter for Indian investors. 
Your job is to extract structured parameters from a user's natural-language financial goal.

Extract the following fields:
- target_amount: The target corpus in INR (e.g., 2 Crores = 20000000)
- timeline_years: Number of years to achieve the goal
- initial_capital: Any lump-sum starting capital mentioned (default 0)
- monthly_income: Monthly income if mentioned (default 0)
- risk_tolerance: "conservative", "moderate", or "aggressive" (infer from context)
- goal_summary: A one-line summary of the goal

IMPORTANT: 
- Convert Indian units: 1 Lakh = 100000, 1 Crore = 10000000
- If timeline is not specified, estimate a reasonable one based on the goal type
- If risk tolerance is not stated, default to "moderate"

Return ONLY valid JSON with these exact field names. No markdown, no explanation."""


async def interpret_goal(goal_input: GoalInput) -> AsyncGenerator[SwarmEvent, None]:
    """Parse a natural-language goal into structured parameters."""

    yield SwarmEvent(
        agent="goal_interpreter",
        event_type="thinking",
        content="Analyzing your financial goal...",
    )

    yield SwarmEvent(
        agent="goal_interpreter",
        event_type="thinking",
        content="Extracting target amount, timeline, and risk profile...",
    )

    try:
        client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

        user_message = f"Goal: {goal_input.goal}"
        if goal_input.initial_capital is not None:
            user_message += f"\nInitial capital: ₹{goal_input.initial_capital:,.0f}"
        if goal_input.monthly_income is not None:
            user_message += f"\nMonthly income: ₹{goal_input.monthly_income:,.0f}"
        if goal_input.risk_tolerance is not None:
            user_message += f"\nRisk tolerance: {goal_input.risk_tolerance}"

        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_completion_tokens=500,
        )

        raw = response.choices[0].message.content or "{}"
        # Strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        data = json.loads(raw)

        # Override with explicit user inputs if provided
        if goal_input.risk_tolerance is not None:
            data["risk_tolerance"] = goal_input.risk_tolerance
        if goal_input.initial_capital is not None:
            data["initial_capital"] = goal_input.initial_capital
        if goal_input.monthly_income is not None:
            data["monthly_income"] = goal_input.monthly_income

        parsed = ParsedGoal(**data)

        yield SwarmEvent(
            agent="goal_interpreter",
            event_type="thinking",
            content=f"Goal identified: {parsed.goal_summary or 'Financial goal'} — ₹{parsed.target_amount:,.0f} in {parsed.timeline_years} years",
        )

        yield SwarmEvent(
            agent="goal_interpreter",
            event_type="result",
            content="Goal analysis complete.",
            data=parsed.model_dump(),
        )

    except json.JSONDecodeError as e:
        yield SwarmEvent(
            agent="goal_interpreter",
            event_type="error",
            content=f"Failed to parse LLM response: {e}",
        )
    except Exception as e:
        yield SwarmEvent(
            agent="goal_interpreter",
            event_type="error",
            content=f"Goal interpretation failed: {e}",
        )
