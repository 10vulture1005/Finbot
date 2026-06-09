"""Pydantic schemas for the Swarm Goal Planner."""

from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


# ── SSE Event Schema ────────────────────────────────────────────────

class SwarmEvent(BaseModel):
    """A single event emitted by a swarm agent during execution."""
    agent: str
    event_type: Literal["thinking", "result", "error"]
    content: str
    data: dict | None = None


# ── Input ────────────────────────────────────────────────────────────

class GoalInput(BaseModel):
    """Raw user input for the swarm planner."""
    goal: str
    initial_capital: float | None = None
    monthly_income: float | None = None
    risk_tolerance: Literal["conservative", "moderate", "aggressive"] | None = None


# ── Agent Output Schemas ─────────────────────────────────────────────

class ParsedGoal(BaseModel):
    """Structured output from the Goal Interpreter agent."""
    target_amount: float = Field(..., description="Target corpus in INR")
    timeline_years: int = Field(..., description="Number of years to achieve goal")
    initial_capital: float = Field(default=0, description="Lump-sum starting capital")
    monthly_income: float = Field(default=0, description="Monthly income for reference")
    risk_tolerance: str = Field(default="moderate", description="conservative | moderate | aggressive")
    goal_summary: str = Field(default="", description="One-line summary of the goal")


class SIPPlan(BaseModel):
    """Output from the SIP Calculator agent."""
    monthly_sip: float = Field(..., description="Required monthly SIP in INR")
    expected_cagr: float = Field(..., description="Expected annual return rate (decimal)")
    inflation_rate: float = Field(default=0.06, description="Assumed inflation rate")
    projected_corpus: float = Field(..., description="Projected corpus at maturity")


class AllocationSlice(BaseModel):
    """A single slice of the asset allocation pie."""
    asset_class: str = Field(..., description="e.g. Large Cap Equity, Debt, Gold")
    percentage: float = Field(..., description="Allocation percentage (0-100)")
    rationale: str = Field(default="", description="Why this allocation")


class AssetAllocation(BaseModel):
    """Output from the Asset Allocator agent."""
    slices: list[AllocationSlice]


class StockPick(BaseModel):
    """A specific stock/fund recommendation from the Market Analyst."""
    symbol: str = Field(..., description="NSE symbol or fund code")
    name: str = Field(..., description="Full name")
    asset_class: str = Field(..., description="Which allocation slice this belongs to")
    weight: float = Field(..., description="Suggested weight within its class (%)")
    rationale: str = Field(default="", description="Why this pick")


class ProjectedValue(BaseModel):
    """A single year's projected portfolio value."""
    year: int
    value: float


class FinalPlan(BaseModel):
    """The complete financial plan assembled by the coordinator."""
    goal: ParsedGoal
    sip: SIPPlan
    allocation: AssetAllocation
    picks: list[StockPick]
    projected_values: list[ProjectedValue]
