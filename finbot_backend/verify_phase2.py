import sys
import os
import logging
from datetime import datetime, timedelta
# Fix Path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.services.market_data_service import MarketDataService
from app.models.market_data import MarketData
from app.quant_engine.pipeline import QuantPipeline

# Config Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_ingestion(db):
    print("\n--- 1. Verifying Ingestion (MarketDataService) ---")
    ticker = "RELIANCE.NS"
    
    # Sync 1 month
    print(f"Syncing {ticker}...")
    success = MarketDataService.sync_ticker(db, ticker, period="1mo")
    
    if success:
        print("  [OK] Sync reported success.")
    else:
        print("  [FAIL] Sync reported failure (might be API issue or empty).")
        
    # Check DB
    count = db.query(MarketData).filter_by(ticker=ticker).count()
    print(f"  Rows in DB for {ticker}: {count}")
    
    if count > 0:
        print("  [OK] Data persisted.")
    else:
        print("  [FAIL] No data found in DB.")

def verify_pipeline(db):
    print("\n--- 2. Verifying Quant Pipeline (MPTSolver Integration) ---")
    pipeline = QuantPipeline()
    
    tickers = ["RELIANCE.NS", "TCS.NS", "INFY.NS"]
    
    # Check if we need to sync them first
    for t in tickers:
        # Check if we have enough data (approx 2y ~ 500 rows, but let's say 400 for safety)
        count = db.query(MarketData).filter_by(ticker=t).count()
        if count < 400:
             print(f"  Syncing {t} (found {count} rows, need more)...")
             MarketDataService.sync_ticker(db, t, period="2y")
    
    print("  Running generate_portfolio...")
    try:
        result = pipeline.generate_portfolio(db, tickers, top_n=3)
        
        print("  Result Keys:", result.keys())
        print("  Model Used:", result.get("model"))
        print("  Selected:", result.get("selected_stocks"))
        print("  Weights:", result.get("weights"))
        
        if result.get("model") == "Hybrid (ML Selection + MPT Optimization)":
            print("  [OK] Pipeline using MPT Strategy.")
        else:
            print(f"  [WARN] Pipeline using {result.get('model')}")
            
        weights = result.get("weights", {})
        if weights and abs(sum(weights.values()) - 1.0) < 0.01:
             print("  [OK] Weights sum to 1.0")
        else:
             print(f"  [FAIL] Weights invalid: {sum(weights.values())}")

    except Exception as e:
        print(f"  [FAIL] Pipeline Execution Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    db = SessionLocal()
    try:
        verify_ingestion(db)
        verify_pipeline(db)
    finally:
        db.close()
