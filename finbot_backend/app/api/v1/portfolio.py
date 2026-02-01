from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.db.session import get_db
from app.schemas.portfolio import *
from app.services.portfolio_service import *

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("/", response_model=list[PortfolioResponse])
def my_portfolio(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return get_portfolio(db, user.id)

@router.post("/", response_model=PortfolioResponse)
def add_to_portfolio(
    payload: PortfolioCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return add_stock(db, user.id, payload)

@router.put("/{stock_id}")
def update_portfolio_stock(
    stock_id: int,
    payload: PortfolioUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return update_stock(db, stock_id, user.id, payload)

# ... (existing imports)
from app.services.rebalancer_service import RebalancerService
from pydantic import BaseModel

class PortfolioActionRequest(BaseModel):
    action: str # "rebalance"
    mode: str = "dry_run" # dry_run | execute
    reason: str = "manual"

@router.post("/{user_id}/actions")
def portfolio_actions(
    user_id: int,
    payload: PortfolioActionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Authorization check (assuming straightforward user_id check)
    if current_user.id != user_id:
        return {"error": "Unauthorized"}
        
    if payload.action == "rebalance":
        service = RebalancerService(db, current_user)
        return service.run_rebalance(mode=payload.mode, reason=payload.reason)
    
    return {"message": "Unknown action"}

@router.delete("/{stock_id}")
def remove_stock(
    stock_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    delete_stock(db, stock_id, user.id)
    return {"message": "Deleted"}
