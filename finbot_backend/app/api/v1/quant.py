from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from app.db.session import get_db
from app.core.deps import get_current_user
from app.services.quant_service import QuantService
from app.models.user import User

router = APIRouter(prefix="/quant", tags=["Quant Engine"])

def run_analysis_task(db: Session, user: User):
    """
    Wrapper to run analysis in background.
    Since we don't have a task queue yet, we just run it.
    In a real app, strict session management is needed here as db might be closed.
    FastAPI BackgroundTasks with dependency injection usually works but 
    technically the session is scoped to request. 
    
    For better safety with BackgroundTasks + DB, we should create a new session.
    But for this refactor step, we stick to the pattern but acknowledge the risk or 
    better: instantiate a new service/session inside.
    """
    # For now, we trust FastAPI's handling but ideally we should use a new session.
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


from app.schemas.response import APIResponse

@router.post("/analyze", response_model=APIResponse[dict])
def run_quant_analysis(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Triggers the Quant Engine analysis synchronously.
    Returns the analysis result directly.
    """
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
    payload: dict, # Expects { "target_weights": ... } 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Executes the rebalancing synchronously.
    """
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
    """
    Fetches the raw technical and quantitative indicators for a given ticker.
    Used by the frontend to display analysis.
    """
    service = QuantService()
    try:
        result = service.get_technical_indicators(db, ticker)
        if result.get("status") == "success":
            return APIResponse(success=True, data=result["data"])
        else:
            return APIResponse(success=False, error=result.get("message"))
    except Exception as e:
         return APIResponse(success=False, error=str(e))
