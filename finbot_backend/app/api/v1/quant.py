from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.db.session import get_db
from app.core.deps import get_current_user
from app.services.quant_service import QuantService
from app.models.user import User
from app.schemas.response import APIResponse

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


# ─── Gemini Risk Analysis ──────────────────────────────────────────────────────

def _build_risk_prompt(holdings: list) -> str:
    """Build a detailed portfolio context prompt for Gemini risk analysis."""
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
    """Extract the risk score label from Gemini's response."""
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
    """Return the cached Gemini risk analysis for the current user."""
    if user.risk_analysis:
        return APIResponse(success=True, data=user.risk_analysis)
    return APIResponse(success=True, data=None, message="No analysis generated yet")

@router.post("/risk-analysis", response_model=APIResponse[dict])
def generate_risk_analysis(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Generate a fresh Gemini risk analysis and persist it to the user record."""
    from app.core.config import settings
    from app.services.portfolio_service import get_portfolio

    if not settings.GEMINI_API_KEY:
        return APIResponse(success=False, error="GEMINI_API_KEY is not configured.")

    holdings = get_portfolio(db, user.id)
    if not holdings:
        return APIResponse(success=False, error="No holdings found in portfolio.")

    prompt = _build_risk_prompt(holdings)

    try:
        # --- UPDATED: Using the new google-genai SDK ---
        from google import genai
        
        # Instantiate the client
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        # Call the model using the client
        response = client.models.generate_content(
            model='gemini-3.1-pro-preview',
            contents=prompt,
        )
        text = response.text.strip()
        # -----------------------------------------------
        
    except Exception as e:
        print(f"[risk_analysis] Gemini error: {e}")
        return APIResponse(success=False, error=f"Gemini API error: {str(e)}")

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
