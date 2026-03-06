from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PortfolioCreate(BaseModel):
    symbol: str
    quantity: float
    avg_price: float
    purchase_date: Optional[datetime] = None

class PortfolioUpdate(BaseModel):
    quantity: float
    avg_price: float
    purchase_date: Optional[datetime] = None

class PortfolioResponse(BaseModel):
    id: int
    symbol: str
    quantity: float
    avg_price: float
    purchase_date: Optional[datetime] = None
    
    # Risk Metrics
    risk_contribution: Optional[float] = None
    volatility: Optional[float] = None
    weight_target: Optional[float] = None
    weight_drift: Optional[float] = None
    
    # Market Data
    current_price: Optional[float] = None
    market_value: Optional[float] = None
    sector: Optional[str] = "Unknown"
    daily_return: Optional[float] = None

    class Config:
        from_attributes = True

class PortfolioHistoryResponse(BaseModel):
    date: datetime
    total_value: float
    daily_return: Optional[float] = None
    
    class Config:
        from_attributes = True
