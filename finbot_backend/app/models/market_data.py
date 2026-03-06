from sqlalchemy import Column, String, Float, DateTime, PrimaryKeyConstraint, Index
from app.db.base import Base
from datetime import datetime

class MarketData(Base):
    """
    Stores historical market data (OHLCV).
    """
    __tablename__ = "market_data"

    ticker = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        PrimaryKeyConstraint('ticker', 'date'),
        Index('idx_market_data_ticker_date', 'ticker', 'date'),
    )
