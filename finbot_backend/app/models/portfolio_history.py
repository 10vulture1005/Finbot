from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime

class PortfolioHistory(Base):
    """
    Tracks the total value and daily return of a user's portfolio over time.
    """
    __tablename__ = "portfolio_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, nullable=False)
    total_value = Column(Float, nullable=False)
    daily_return = Column(Float, nullable=True) # Percentage return for that day
    
    # Metadata
    cash_balance = Column(Float, default=0.0)
    equity_value = Column(Float, default=0.0)
    
    user = relationship("User")

    __table_args__ = (
        Index('idx_portfolio_history_user_date', 'user_id', 'date'),
    )
