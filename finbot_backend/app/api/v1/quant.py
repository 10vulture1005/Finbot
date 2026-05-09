from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from app.db.session import get_db
from app.core.deps import get_current_user
from app.services.quant_service import QuantService
from app.models.user import User
from app.schemas.response import APIResponse
from pydantic import BaseModel
from typing import Optional
import numpy as np
import pandas as pd
import math
import json

router = APIRouter(prefix="/quant", tags=["Quant Engine"])


def run_analysis_task(db: Session, user: User):
    service = QuantService()
    try:
        service.run_analysis(db, user)
    except Exception as e:
        print(f"Background Analysis Failed: {e}")


def run_rebalance_task(db: Session, user: User, target_weights: dict):
    service = QuantService()
    try:
        service.execute_rebalance(db, user, target_weights)
    except Exception as e:
        print(f"Background Rebalance Failed: {e}")


@router.post("/analyze", response_model=APIResponse[dict])
def run_quant_analysis(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    service = QuantService()
    try:
        result = service.run_analysis(db, user)
        if result.get("status") == "error":
            return APIResponse(success=False, error=result.get("message"))
        return APIResponse(success=True, data=result.get("data", {}), message="Quant analysis complete")
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/rebalance", response_model=APIResponse[dict])
def execute_quant_rebalance(
    payload: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    target_weights = payload.get("target_weights", {})
    if not target_weights:
        return APIResponse(success=False, error="No target weights provided.")
    service = QuantService()
    try:
        result = service.execute_rebalance(db, user, target_weights)
        return APIResponse(success=True, data=result)
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/indicators/{ticker}", response_model=APIResponse[dict])
def get_quant_indicators(
    ticker: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    service = QuantService()
    try:
        result = service.get_technical_indicators(db, ticker)
        if result.get("status") == "success":
            return APIResponse(success=True, data=result["data"])
        else:
            return APIResponse(success=False, error=result.get("message"))
    except Exception as e:
        return APIResponse(success=False, error=str(e))


# ─── Groq Risk Analysis ───────────────────────────────────────────────────────

def _build_risk_prompt(holdings: list) -> str:
    """Build a detailed portfolio context prompt for Groq risk analysis."""
    if not holdings:
        return ""

    total_invested = sum(h.quantity * h.avg_price for h in holdings)
    total_value = sum(
        (h.market_value or (h.quantity * (h.current_price or h.avg_price)))
        for h in holdings
    )
    total_pnl = total_value - total_invested
    total_pnl_pct = (total_pnl / total_invested * 100) if total_invested > 0 else 0.0

    rows = []
    for h in sorted(holdings, key=lambda x: x.market_value or 0, reverse=True):
        mv = h.market_value or (h.quantity * (h.current_price or h.avg_price))
        weight = (mv / total_value * 100) if total_value > 0 else 0
        cost = h.quantity * h.avg_price
        pnl_pct = ((mv - cost) / cost * 100) if cost else 0
        risk_contrib = (h.risk_contribution or 0) * 100
        vol = (h.volatility or 0) * 100
        rows.append(
            f"| {h.symbol} | {weight:.1f}% | {pnl_pct:+.1f}% | "
            f"{vol:.1f}% | {risk_contrib:.1f}% | {h.sector or 'Unknown'} |"
        )

    sector_map: dict = {}
    for h in holdings:
        s = h.sector or "Unknown"
        mv = h.market_value or (h.quantity * (h.current_price or h.avg_price))
        sector_map[s] = sector_map.get(s, 0) + mv
    sector_summary = ", ".join(
        f"{s}: {v / total_value * 100:.1f}%" for s, v in
        sorted(sector_map.items(), key=lambda x: x[1], reverse=True)
    ) if total_value > 0 else "N/A"

    today = datetime.now().strftime("%d %b %Y")
    table = "\n".join(rows)

    return f"""Analyze Indian Equity Risk. 
Date:{datetime.now().strftime("%d%b%y")}
Stats: Inv Rs{total_invested:,.0f}, Val Rs{total_value:,.0f}, PnL {total_pnl_pct:+.1f}%.
Sectors: {sector_summary}
Data:
|Sym|Wgt|PnL|Vol|Risk|Sec|
|---|---|---|---|---|---|
{table}

Format strictly:
RISK_SCORE: [Low/Medium/High]
OVERALL_ASSESSMENT: [2-3 sentences]
CONCENTRATION_RISK: [Analyze >20% stock or >40% sector]
VOLATILITY_ANALYSIS: [Stock vs Portfolio risk]
DIVERSIFICATION: [Sectors/Market caps]
KEY_RISKS: [Bullet list 3-5]
RECOMMENDATIONS: [Bullet list 3-5 actionable]
Concise, data-driven, use symbols."""
def _parse_risk_score(text: str) -> str:
    """Extract the risk score label from Groq's response."""
    for line in text.splitlines():
        if line.strip().upper().startswith("RISK_SCORE:"):
            val = line.split(":", 1)[-1].strip().capitalize()
            if val in ("Low", "Medium", "High"):
                return val
    return "Medium"


@router.get("/risk-analysis", response_model=APIResponse[dict])
def get_risk_analysis(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Return the cached Groq risk analysis for the current user."""
    if user.risk_analysis:
        return APIResponse(success=True, data=user.risk_analysis)
    return APIResponse(success=True, data=None, message="No analysis generated yet")

@router.post("/risk-analysis", response_model=APIResponse[dict])
def generate_risk_analysis(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Generate a fresh Groq risk analysis and persist it to the user record."""
    from app.core.config import settings
    from app.services.portfolio_service import get_portfolio

    if not settings.GROQ_API_KEY:
        return APIResponse(success=False, error="GROQ_API_KEY is not configured.")

    holdings = get_portfolio(db, user.id)
    if not holdings:
        return APIResponse(success=False, error="No holdings found in portfolio.")

    prompt = _build_risk_prompt(holdings)

    try:
        from groq import Groq

        client = Groq(api_key=settings.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional portfolio risk analyst. Respond only in the structured format requested."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=1024,
        )
        text = completion.choices[0].message.content.strip()

    except Exception as e:
        print(f"[risk_analysis] Groq error: {e}")
        return APIResponse(success=False, error=f"Groq API error: {str(e)}")

    risk_score = _parse_risk_score(text)
    generated_at = datetime.now(timezone.utc).isoformat()

    result = {
        "text": text,
        "risk_score": risk_score,
        "generated_at": generated_at,
        "holdings_count": len(holdings),
    }

    try:
        user.risk_analysis = result
        db.commit()
        print(f"[risk_analysis] Generated for user_id={user.id}, score={risk_score}")
    except Exception as e:
        db.rollback()
        print(f"[risk_analysis] DB save error: {e}")

    return APIResponse(success=True, data=result, message="Risk analysis generated successfully")


# ─── Backtest: Portfolio vs NIFTY50 ───────────────────────────────────────────

@router.get("/backtest", response_model=APIResponse[dict])
def backtest_portfolio(
    period: str = Query("1y", regex="^(1y|3y|5y)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Compare user's portfolio performance against NIFTY50 over 1Y/3Y/5Y."""
    from app.services.portfolio_service import get_portfolio
    import yfinance as yf

    holdings = get_portfolio(db, user.id)
    if not holdings:
        return APIResponse(success=False, error="No holdings found in portfolio.")

    tickers = []
    qty_map = {}
    for h in holdings:
        sym = h.symbol if h.symbol.endswith(".NS") or h.symbol.endswith(".BO") else f"{h.symbol}.NS"
        tickers.append(sym)
        qty_map[sym] = h.quantity

    try:
        all_tickers = tickers + ["^NSEI"]
        raw = yf.download(all_tickers, period=period, interval="1d", progress=False, timeout=20)
        if raw is None or raw.empty:
            return APIResponse(success=False, error="Failed to fetch historical data from yfinance.")

        price_key = "Adj Close" if "Adj Close" in raw.columns.get_level_values(0) else "Close"
        prices = raw[price_key]

        if isinstance(prices, pd.Series):
            prices = prices.to_frame(name=all_tickers[0])

        # Build portfolio value series
        portfolio_series = []
        nifty_series = []

        for date_idx in prices.index:
            # Portfolio value
            daily_val = 0.0
            valid = False
            for sym in tickers:
                try:
                    p = float(prices.at[date_idx, sym])
                    if not math.isnan(p) and p > 0:
                        daily_val += p * qty_map.get(sym, 0)
                        valid = True
                except Exception:
                    pass
            if valid and daily_val > 0:
                date_str = date_idx.strftime("%Y-%m-%d")
                portfolio_series.append({"date": date_str, "value": round(daily_val, 2)})

            # NIFTY50
            try:
                nifty_val = float(prices.at[date_idx, "^NSEI"])
                if not math.isnan(nifty_val) and nifty_val > 0:
                    date_str = date_idx.strftime("%Y-%m-%d")
                    nifty_series.append({"date": date_str, "value": round(nifty_val, 2)})
            except Exception:
                pass

        # Normalize to 100 base for comparison
        if portfolio_series:
            base_p = portfolio_series[0]["value"]
            portfolio_norm = [{"date": p["date"], "value": round(p["value"] / base_p * 100, 2)} for p in portfolio_series]
        else:
            portfolio_norm = []

        if nifty_series:
            base_n = nifty_series[0]["value"]
            nifty_norm = [{"date": n["date"], "value": round(n["value"] / base_n * 100, 2)} for n in nifty_series]
        else:
            nifty_norm = []

        # Calculate total returns
        portfolio_return = ((portfolio_series[-1]["value"] / portfolio_series[0]["value"] - 1) * 100) if len(portfolio_series) > 1 else 0
        nifty_return = ((nifty_series[-1]["value"] / nifty_series[0]["value"] - 1) * 100) if len(nifty_series) > 1 else 0

        return APIResponse(success=True, data={
            "period": period,
            "portfolio": portfolio_norm,
            "nifty50": nifty_norm,
            "portfolio_return": round(portfolio_return, 2),
            "nifty_return": round(nifty_return, 2),
            "alpha": round(portfolio_return - nifty_return, 2),
        })

    except Exception as e:
        print(f"[backtest] Error: {e}")
        return APIResponse(success=False, error=str(e))


# ─── Tax Harvest Suggester ────────────────────────────────────────────────────

@router.get("/tax-harvest", response_model=APIResponse[list])
def tax_harvest_suggestions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Scan holdings for STCG/LTCG tax-loss harvesting opportunities."""
    from app.services.portfolio_service import get_portfolio

    holdings = get_portfolio(db, user.id)
    if not holdings:
        return APIResponse(success=True, data=[], message="No holdings to analyse.")

    now = datetime.now()
    suggestions = []

    for h in holdings:
        cost = h.quantity * h.avg_price
        current_price = h.current_price or h.avg_price
        market_value = h.market_value or (h.quantity * current_price)
        unrealised_pnl = market_value - cost
        unrealised_pnl_pct = (unrealised_pnl / cost * 100) if cost > 0 else 0

        purchase_date = h.purchase_date or now
        days_held = (now - purchase_date).days if isinstance(purchase_date, datetime) else 0
        tax_type = "LTCG" if days_held >= 365 else "STCG"

        # India tax rates (2024-25): STCG 20%, LTCG 12.5% (above ₹1.25L exemption)
        tax_rate = 0.125 if tax_type == "LTCG" else 0.20
        tax_liability = max(0, unrealised_pnl * tax_rate) if unrealised_pnl > 0 else 0
        tax_saving = abs(unrealised_pnl * tax_rate) if unrealised_pnl < 0 else 0

        action = "none"
        reason = ""
        priority = 0

        if unrealised_pnl < 0:
            # Loss — harvest candidate
            action = "harvest"
            if tax_type == "STCG":
                reason = f"Book ₹{abs(unrealised_pnl):,.0f} short-term loss to offset STCG gains (saves ~₹{tax_saving:,.0f} tax)"
                priority = 3
            else:
                reason = f"Book ₹{abs(unrealised_pnl):,.0f} long-term loss to offset LTCG gains (saves ~₹{tax_saving:,.0f} tax)"
                priority = 2
        elif unrealised_pnl > 0 and tax_type == "STCG" and days_held > 300:
            # Close to LTCG threshold — HOLD
            days_to_ltcg = 365 - days_held
            action = "hold"
            reason = f"Only {days_to_ltcg} days until LTCG. Holding saves {(0.20 - 0.125)*100:.1f}% tax on ₹{unrealised_pnl:,.0f} gains"
            priority = 2
        elif unrealised_pnl > 0 and tax_type == "STCG":
            action = "caution"
            reason = f"Selling now incurs 20% STCG tax on ₹{unrealised_pnl:,.0f} profit (₹{tax_liability:,.0f})"
            priority = 1

        suggestions.append({
            "symbol": h.symbol,
            "quantity": h.quantity,
            "avg_price": h.avg_price,
            "current_price": current_price,
            "unrealised_pnl": round(unrealised_pnl, 2),
            "unrealised_pnl_pct": round(unrealised_pnl_pct, 2),
            "days_held": days_held,
            "tax_type": tax_type,
            "tax_rate": tax_rate,
            "tax_liability": round(tax_liability, 2),
            "tax_saving": round(tax_saving, 2),
            "action": action,
            "reason": reason,
            "priority": priority,
        })

    # Sort by priority (highest first)
    suggestions.sort(key=lambda x: x["priority"], reverse=True)
    return APIResponse(success=True, data=suggestions)


# ─── Dividend Tracker ─────────────────────────────────────────────────────────

@router.get("/dividends", response_model=APIResponse[dict])
def dividend_tracker(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Pull dividend history and project annual income from current holdings."""
    from app.services.portfolio_service import get_portfolio
    import yfinance as yf

    holdings = get_portfolio(db, user.id)
    if not holdings:
        return APIResponse(success=True, data={"holdings": [], "total_annual_income": 0}, message="No holdings.")

    result_holdings = []
    total_annual_income = 0.0

    for h in holdings:
        sym = h.symbol if h.symbol.endswith(".NS") or h.symbol.endswith(".BO") else f"{h.symbol}.NS"
        try:
            ticker = yf.Ticker(sym)
            divs = ticker.dividends
            if divs is None or divs.empty:
                result_holdings.append({
                    "symbol": h.symbol,
                    "quantity": h.quantity,
                    "dividend_yield": 0,
                    "annual_income": 0,
                    "last_dividend": None,
                    "history": [],
                })
                continue

            # Last 3 years of dividends
            three_years_ago = datetime.now() - timedelta(days=365 * 3)
            recent_divs = divs[divs.index >= three_years_ago.strftime("%Y-%m-%d")]

            # Annual dividend per share (average of last 2 years, or last year)
            one_year_ago = datetime.now() - timedelta(days=365)
            last_year_divs = divs[divs.index >= one_year_ago.strftime("%Y-%m-%d")]
            annual_div_per_share = float(last_year_divs.sum()) if not last_year_divs.empty else 0.0
            projected_income = annual_div_per_share * h.quantity

            current_price = h.current_price or h.avg_price
            div_yield = (annual_div_per_share / current_price * 100) if current_price > 0 else 0

            history = [
                {"date": idx.strftime("%Y-%m-%d"), "amount": round(float(val), 2)}
                for idx, val in recent_divs.items()
            ]

            result_holdings.append({
                "symbol": h.symbol,
                "quantity": h.quantity,
                "dividend_yield": round(div_yield, 2),
                "annual_income": round(projected_income, 2),
                "last_dividend": history[-1] if history else None,
                "history": history,
            })
            total_annual_income += projected_income

        except Exception as e:
            print(f"[dividends] Error for {h.symbol}: {e}")
            result_holdings.append({
                "symbol": h.symbol,
                "quantity": h.quantity,
                "dividend_yield": 0,
                "annual_income": 0,
                "last_dividend": None,
                "history": [],
                "error": str(e),
            })

    return APIResponse(success=True, data={
        "holdings": result_holdings,
        "total_annual_income": round(total_annual_income, 2),
    })


# ─── Correlation Heatmap ─────────────────────────────────────────────────────

@router.get("/correlation", response_model=APIResponse[dict])
def correlation_matrix(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Compute correlation matrix of daily returns for user's holdings."""
    from app.services.portfolio_service import get_portfolio
    import yfinance as yf

    holdings = get_portfolio(db, user.id)
    if not holdings or len(holdings) < 2:
        return APIResponse(success=False, error="Need at least 2 holdings to compute correlation.")

    tickers = []
    labels = []
    for h in holdings:
        sym = h.symbol if h.symbol.endswith(".NS") or h.symbol.endswith(".BO") else f"{h.symbol}.NS"
        tickers.append(sym)
        labels.append(h.symbol.replace(".NS", "").replace(".BO", ""))

    try:
        raw = yf.download(tickers, period="1y", interval="1d", progress=False, timeout=15)
        if raw is None or raw.empty:
            return APIResponse(success=False, error="Failed to fetch price data.")

        price_key = "Adj Close" if "Adj Close" in raw.columns.get_level_values(0) else "Close"
        prices = raw[price_key]

        if isinstance(prices, pd.Series):
            return APIResponse(success=False, error="Need at least 2 holdings with data.")

        returns = prices.pct_change().dropna()
        corr = returns.corr()

        # Clean column names
        clean_cols = [c.replace(".NS", "").replace(".BO", "") for c in corr.columns]

        matrix = []
        for i, row_label in enumerate(clean_cols):
            for j, col_label in enumerate(clean_cols):
                val = float(corr.iloc[i, j])
                if not math.isnan(val):
                    matrix.append({
                        "x": col_label,
                        "y": row_label,
                        "value": round(val, 3),
                    })

        return APIResponse(success=True, data={
            "labels": clean_cols,
            "matrix": matrix,
        })

    except Exception as e:
        print(f"[correlation] Error: {e}")
        return APIResponse(success=False, error=str(e))


# ─── What-If Simulator ───────────────────────────────────────────────────────

class WhatIfPayload(BaseModel):
    add: list[dict] = []      # [{"symbol": "TCS.NS", "quantity": 10, "avg_price": 3500}]
    remove: list[str] = []    # ["RELIANCE.NS"]


@router.post("/whatif", response_model=APIResponse[dict])
def whatif_simulator(
    payload: WhatIfPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Simulate adding/removing stocks and compare metrics vs current portfolio."""
    from app.services.portfolio_service import get_portfolio
    import yfinance as yf

    holdings = get_portfolio(db, user.id)
    if not holdings:
        return APIResponse(success=False, error="No holdings found.")

    # Build current state
    current_map = {}
    for h in holdings:
        sym = h.symbol if h.symbol.endswith(".NS") or h.symbol.endswith(".BO") else f"{h.symbol}.NS"
        current_map[sym] = {
            "quantity": h.quantity,
            "avg_price": h.avg_price,
            "current_price": h.current_price or h.avg_price,
            "sector": h.sector or "Unknown",
        }

    # Build hypothetical state
    hypo_map = dict(current_map)
    for r in payload.remove:
        sym = r if r.endswith(".NS") or r.endswith(".BO") else f"{r}.NS"
        hypo_map.pop(sym, None)
    for a in payload.add:
        sym = a["symbol"] if a["symbol"].endswith(".NS") or a["symbol"].endswith(".BO") else f"{a['symbol']}.NS"
        if sym in hypo_map:
            # Average up/down
            old = hypo_map[sym]
            total_qty = old["quantity"] + a["quantity"]
            new_avg = (old["quantity"] * old["avg_price"] + a["quantity"] * a["avg_price"]) / total_qty
            hypo_map[sym]["quantity"] = total_qty
            hypo_map[sym]["avg_price"] = new_avg
        else:
            hypo_map[sym] = {
                "quantity": a["quantity"],
                "avg_price": a["avg_price"],
                "current_price": a["avg_price"],
                "sector": "Unknown",
            }

    def compute_metrics(stock_map: dict) -> dict:
        if not stock_map:
            return {"total_value": 0, "volatility": 0, "sharpe": 0, "sectors": {}}

        syms = list(stock_map.keys())
        try:
            raw = yf.download(syms, period="1y", interval="1d", progress=False, timeout=15)
            if raw is None or raw.empty:
                return {"total_value": 0, "volatility": 0, "sharpe": 0, "sectors": {}}

            price_key = "Adj Close" if "Adj Close" in raw.columns.get_level_values(0) else "Close"
            prices = raw[price_key]

            if isinstance(prices, pd.Series):
                prices = prices.to_frame(name=syms[0])

            returns = prices.pct_change().dropna()

            # Portfolio weights by market value
            total_val = sum(stock_map[s]["current_price"] * stock_map[s]["quantity"] for s in syms)
            weights = np.array([
                (stock_map[s]["current_price"] * stock_map[s]["quantity"]) / total_val if total_val > 0 else 0
                for s in syms
            ])

            # Filter returns to available columns
            available = [s for s in syms if s in returns.columns]
            if not available:
                return {"total_value": round(total_val, 2), "volatility": 0, "sharpe": 0, "sectors": {}}

            ret_matrix = returns[available].values
            avail_weights = np.array([
                (stock_map[s]["current_price"] * stock_map[s]["quantity"]) / total_val if total_val > 0 else 0
                for s in available
            ])
            avail_weights = avail_weights / avail_weights.sum() if avail_weights.sum() > 0 else avail_weights

            port_returns = ret_matrix @ avail_weights
            ann_vol = float(np.std(port_returns) * np.sqrt(252))
            ann_ret = float(np.mean(port_returns) * 252)
            sharpe = (ann_ret - 0.05) / ann_vol if ann_vol > 0 else 0

            # Sectors
            sector_map = {}
            for s in syms:
                sec = stock_map[s].get("sector", "Unknown")
                val = stock_map[s]["current_price"] * stock_map[s]["quantity"]
                sector_map[sec] = sector_map.get(sec, 0) + val

            sectors = {k: round(v / total_val * 100, 1) for k, v in sector_map.items()} if total_val > 0 else {}

            return {
                "total_value": round(total_val, 2),
                "volatility": round(ann_vol, 4),
                "sharpe": round(sharpe, 2),
                "expected_return": round(ann_ret, 4),
                "sectors": sectors,
            }
        except Exception as e:
            print(f"[whatif] metrics error: {e}")
            return {"total_value": 0, "volatility": 0, "sharpe": 0, "sectors": {}}

    current_metrics = compute_metrics(current_map)
    hypothetical_metrics = compute_metrics(hypo_map)

    return APIResponse(success=True, data={
        "current": current_metrics,
        "hypothetical": hypothetical_metrics,
        "changes": {
            "added": [a["symbol"] for a in payload.add],
            "removed": payload.remove,
        }
    })


# ─── Market Regime Detection ─────────────────────────────────────────────────

@router.get("/regime", response_model=APIResponse[dict])
def market_regime(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Detect current market regime (BULL/BEAR/HIGH_VOL) from user's holdings."""
    from app.services.portfolio_service import get_portfolio
    import yfinance as yf

    holdings = get_portfolio(db, user.id)
    if not holdings:
        return APIResponse(success=False, error="No holdings found.")

    tickers = []
    for h in holdings:
        sym = h.symbol if h.symbol.endswith(".NS") or h.symbol.endswith(".BO") else f"{h.symbol}.NS"
        tickers.append(sym)

    try:
        raw = yf.download(tickers, period="6mo", interval="1d", progress=False, timeout=15)
        if raw is None or raw.empty:
            return APIResponse(success=False, error="Failed to fetch market data.")

        price_key = "Adj Close" if "Adj Close" in raw.columns.get_level_values(0) else "Close"
        prices = raw[price_key]

        if isinstance(prices, pd.Series):
            prices = prices.to_frame(name=tickers[0])

        returns = prices.pct_change().dropna()

        # Volatility
        asset_vols = returns.std() * np.sqrt(252)
        market_vol = float(asset_vols.mean())

        # Trend — equal-weight index
        market_index = (1 + returns.mean(axis=1)).cumprod()
        peak = market_index.cummax()
        drawdown = (market_index - peak) / peak
        current_dd = float(drawdown.iloc[-1])

        # 30-day momentum
        if len(market_index) >= 30:
            momentum_30d = float((market_index.iloc[-1] / market_index.iloc[-30] - 1) * 100)
        else:
            momentum_30d = 0.0

        # Regime classification
        if market_vol > 0.20:
            regime = "HIGH_VOL"
            description = "High volatility regime — markets are turbulent. Consider defensive positioning."
            color = "orange"
        elif current_dd < -0.20:
            regime = "BEAR"
            description = "Bear market detected — significant drawdown from peaks. Exercise caution."
            color = "red"
        elif momentum_30d > 5:
            regime = "BULL"
            description = "Bull market — strong positive momentum. Favour growth-oriented strategies."
            color = "green"
        else:
            regime = "NEUTRAL"
            description = "Neutral market conditions. Balanced approach recommended."
            color = "blue"

        return APIResponse(success=True, data={
            "regime": regime,
            "description": description,
            "color": color,
            "metrics": {
                "volatility": round(market_vol * 100, 1),
                "drawdown": round(current_dd * 100, 1),
                "momentum_30d": round(momentum_30d, 1),
            },
            "as_of": datetime.now(timezone.utc).isoformat(),
        })

    except Exception as e:
        print(f"[regime] Error: {e}")
        return APIResponse(success=False, error=str(e))

