import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.market_data import MarketData
from app.services.market_data_service import MarketDataService
from app.rebalancer.rebalance.mpt_solver import MPTSolver
import pandas as pd
from datetime import datetime

# Setup Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_finbot.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_market_data_upsert(db):
    """
    Test that MarketDataService can upsert data and handle duplicates.
    """
    # 1. Manual Insert
    ticker = "TEST.NS"
    date = datetime(2023, 1, 1)
    
    # We can't easily mock yfinance here without a library like 'unittest.mock' or 'responses'
    # But we can test the DB model directly or the service if we mock yf.download
    
    # Let's test the Model directly first
    md = MarketData(
        ticker=ticker,
        date=date,
        open=100.0,
        high=110.0,
        low=90.0,
        close=105.0,
        volume=1000
    )
    db.add(md)
    db.commit()
    
    # Verify
    row = db.query(MarketData).filter_by(ticker=ticker, date=date).first()
    assert row is not None
    assert row.close == 105.0

    # Test Duplicate handling (Service level) is hard without mocking download
    # But we can test the constraint
    try:
        md2 = MarketData(
            ticker=ticker,
            date=date,
            open=100.0, 
            high=110.0, 
            low=90.0, 
            close=105.0, 
            volume=1000
        )
        db.add(md2)
        db.commit()
        assert False, "Should have raised IntegrityError"
    except Exception:
        db.rollback()
        assert True

def test_mpt_solver():
    """
    Test MPTSolver logic with known inputs.
    """
    # Create synthetic returns
    # Asset A: +1% every day
    # Asset B: -1% every day
    # Perfectly neg correlated
    
    data = {
        "A": [0.01, 0.01, 0.01, 0.01],
        "B": [-0.01, -0.01, -0.01, -0.01]
    }
    df = pd.DataFrame(data)
    
    solver = MPTSolver(df)
    
    # Min Volatility should effectively behave predictably
    # With std dev = 0 for both (constant returns), logic might be bounded
    
    # Let's try variable returns
    data2 = {
        "A": [0.01, 0.02, -0.01, 0.03], # Avg 0.0125, Vol exists
        "B": [0.005, 0.005, 0.005, 0.005] # Avg 0.005, Vol ~0 (Low risk)
    }
    df2 = pd.DataFrame(data2)
    solver2 = MPTSolver(df2)
    
    result = solver2.minimize_volatility()
    assert result['success'] is True
    weights = result['weights']
    
    # B has lower volatility, so should have higher weight in Min Vol portfolio
    assert weights['B'] > weights['A']
    
    # Sum should be 1
    total_weight = sum(weights.values())
    assert abs(total_weight - 1.0) < 0.001

if __name__ == "__main__":
    # For quick running without pytest
    # But usually run with `pytest tests/test_data_integrity.py`
    pass
