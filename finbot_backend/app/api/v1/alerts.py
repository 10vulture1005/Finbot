from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.alert import PriceAlert
from app.models.user import User
from app.schemas.response import APIResponse

router = APIRouter(prefix="/alerts", tags=["Price Alerts"])


class AlertCreate(BaseModel):
    symbol: str
    target_price: float
    condition: str = "above"  # "above" | "below"


@router.get("", response_model=APIResponse[list])
def list_alerts(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all price alerts for the current user."""
    alerts = db.query(PriceAlert).filter_by(user_id=user.id).order_by(PriceAlert.created_at.desc()).all()
    return APIResponse(success=True, data=[
        {
            "id": a.id,
            "symbol": a.symbol,
            "target_price": a.target_price,
            "condition": a.condition,
            "is_triggered": a.is_triggered,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in alerts
    ])


@router.post("", response_model=APIResponse[dict])
def create_alert(
    payload: AlertCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new price alert."""
    if payload.condition not in ("above", "below"):
        return APIResponse(success=False, error="condition must be 'above' or 'below'")

    alert = PriceAlert(
        user_id=user.id,
        symbol=payload.symbol.upper(),
        target_price=payload.target_price,
        condition=payload.condition,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    return APIResponse(success=True, data={
        "id": alert.id,
        "symbol": alert.symbol,
        "target_price": alert.target_price,
        "condition": alert.condition,
        "is_triggered": alert.is_triggered,
        "created_at": alert.created_at.isoformat() if alert.created_at else None,
    }, message="Alert created successfully")


@router.delete("/{alert_id}", response_model=APIResponse[dict])
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete a price alert."""
    alert = db.query(PriceAlert).filter_by(id=alert_id, user_id=user.id).first()
    if not alert:
        return APIResponse(success=False, error="Alert not found")
    db.delete(alert)
    db.commit()
    return APIResponse(success=True, message="Alert deleted")


@router.get("/check", response_model=APIResponse[list])
def check_alerts(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Check all active alerts against current prices and return triggered ones."""
    import yfinance as yf
    import math

    alerts = db.query(PriceAlert).filter_by(user_id=user.id, is_triggered=False).all()
    if not alerts:
        return APIResponse(success=True, data=[], message="No active alerts")

    # Group symbols
    symbols = list(set(a.symbol for a in alerts))
    tickers = [s if s.endswith(".NS") or s.endswith(".BO") else f"{s}.NS" for s in symbols]

    try:
        data = yf.download(tickers, period="1d", interval="1d", progress=False, timeout=10)
        if data is None or data.empty:
            return APIResponse(success=True, data=[], message="Could not fetch prices")

        price_key = "Adj Close" if "Adj Close" in data.columns.get_level_values(0) else "Close"
        prices = data[price_key]

        if hasattr(prices, 'iloc') and len(prices) > 0:
            last_prices = prices.iloc[-1]
        else:
            return APIResponse(success=True, data=[], message="No price data available")

    except Exception as e:
        print(f"[alerts] Price fetch error: {e}")
        return APIResponse(success=True, data=[], message=f"Price fetch error: {e}")

    triggered = []
    for alert in alerts:
        sym = alert.symbol if alert.symbol.endswith(".NS") or alert.symbol.endswith(".BO") else f"{alert.symbol}.NS"
        try:
            if len(tickers) == 1:
                price = float(last_prices) if not hasattr(last_prices, '__getitem__') else float(last_prices.iloc[0])
            else:
                price = float(last_prices[sym])

            if math.isnan(price):
                continue

            hit = False
            if alert.condition == "above" and price >= alert.target_price:
                hit = True
            elif alert.condition == "below" and price <= alert.target_price:
                hit = True

            if hit:
                alert.is_triggered = True
                triggered.append({
                    "id": alert.id,
                    "symbol": alert.symbol,
                    "target_price": alert.target_price,
                    "current_price": round(price, 2),
                    "condition": alert.condition,
                    "message": f"🔔 {alert.symbol} is now {'above' if alert.condition == 'above' else 'below'} ₹{alert.target_price:,.2f} (current: ₹{price:,.2f})"
                })
        except Exception:
            pass

    if triggered:
        db.commit()

    return APIResponse(success=True, data=triggered)
