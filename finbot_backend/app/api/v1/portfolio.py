from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.db.session import get_db
from app.schemas.portfolio import PortfolioResponse, PortfolioCreate, PortfolioUpdate, PortfolioHistoryResponse
from app.services.portfolio_service import get_portfolio, add_stock, update_stock, delete_stock, delete_all_stocks, get_portfolio_history, get_portfolio_analytics, get_portfolio_growth

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

from app.schemas.response import APIResponse

@router.get("", response_model=APIResponse[list[PortfolioResponse]])
def my_portfolio(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    data = get_portfolio(db, user.id)
    return APIResponse(success=True, data=data)

@router.get("/history", response_model=APIResponse[list[PortfolioHistoryResponse]])
def portfolio_history(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    data = get_portfolio_history(db, user.id)
    return APIResponse(success=True, data=data)

@router.get("/analytics", response_model=APIResponse[dict])
def portfolio_analytics(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    try:
        data = get_portfolio_analytics(db, user.id)
        return APIResponse(success=True, data=data)
    except Exception as e:
        print(f"Error serving portfolio analytics: {e}")
        return APIResponse(success=False, error="Failed to calculate analytics")

@router.get("/growth", response_model=APIResponse[list[dict]])
def portfolio_growth(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Return a 30-day portfolio value timeline computed from yfinance historical prices."""
    try:
        data = get_portfolio_growth(db, user.id)
        return APIResponse(success=True, data=data)
    except Exception as e:
        print(f"Error computing portfolio growth: {e}")
        return APIResponse(success=False, error="Failed to compute growth data", data=[])



@router.post("", response_model=APIResponse[PortfolioResponse])
def add_to_portfolio(
    payload: PortfolioCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    data = add_stock(db, user.id, payload)
    return APIResponse(success=True, data=data, message="Stock added successfully")

@router.put("/{stock_id}", response_model=APIResponse[PortfolioResponse])
def update_portfolio_stock(
    stock_id: int,
    payload: PortfolioUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    data = update_stock(db, stock_id, user.id, payload)
    return APIResponse(success=True, data=data, message="Stock updated successfully")

# ... (existing imports)
from app.services.rebalancer_service import RebalancerService
from app.services.risk_rebalancer_service import RiskRebalancerService
from pydantic import BaseModel

class PortfolioActionRequest(BaseModel):
    action: str # "rebalance" | "risk_rebalance"
    mode: str = "dry_run" # dry_run | execute
    reason: str = "manual"

@router.post("/actions", response_model=APIResponse[dict])
def portfolio_actions(
    payload: PortfolioActionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if payload.action == "rebalance":
        service = RebalancerService(db, current_user)
        result = service.run_rebalance(mode=payload.mode, reason=payload.reason)
        return APIResponse(success=True, data=result, message="Rebalance action executed")
    elif payload.action == "risk_rebalance":
        service = RiskRebalancerService(db, current_user)
        result = service.run_rebalance(mode=payload.mode, reason=payload.reason)
        return APIResponse(success=True, data=result, message="Risk-reducing rebalance executed")
    
    return APIResponse(success=False, error="Unknown action")

@router.delete("/{stock_id}", response_model=APIResponse[dict])
def remove_stock(
    stock_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    delete_stock(db, stock_id, user.id)
    return APIResponse(success=True, message="Deleted")

@router.delete("", response_model=APIResponse[dict])
def remove_all_stocks(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    delete_all_stocks(db, user.id)
    return APIResponse(success=True, message="All stocks deleted")
