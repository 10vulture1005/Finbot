from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime

class PortfolioStock(Base):
    __tablename__ = "portfolio_stocks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    symbol = Column(String, index=True)
    quantity = Column(Float)
    avg_price = Column(Float)

    # Risk Metrics
    risk_contribution = Column(Float, nullable=True)
    volatility = Column(Float, nullable=True)
    weight_target = Column(Float, nullable=True)
    weight_drift = Column(Float, nullable=True)

    user = relationship("User")

class PortfolioEvent(Base):
    """
    Audit log for portfolio rebalancing and risk events.
    """
    __tablename__ = "portfolio_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    event_type = Column(String, index=True) # "rebalance"
    event_payload = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
