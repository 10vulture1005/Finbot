import argparse
import logging
from datetime import datetime, timedelta
import pandas as pd
import sys
import os

# Adapt path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.backtest.engine import BacktestEngine
from app.backtest.metrics import BacktestMetrics
from app.backtest.scenarios import StressScenarioGenerator
from unittest.mock import MagicMock

# Database Mock (since we don't have a real DB populated easily in this env)
# In production, use real DB session.
class MockSession:
    def query(self, *args):
        return self
    def filter(self, *args):
        return self
    def all(self):
        return []

def main():
    parser = argparse.ArgumentParser(description="Run Realistic Backtest Simulation")
    parser.add_argument("--tickers", nargs="+", default=["AAPL", "MSFT", "GOOG"], help="Tickers to include")
    parser.add_argument("--start", type=str, default="2023-01-01", help="Start Date YYYY-MM-DD")
    parser.add_argument("--end", type=str, default="2023-12-31", help="End Date YYYY-MM-DD")
    parser.add_argument("--scenario", type=str, default="BASE", choices=["BASE", "CRASH", "HIGH_VOL"], help="Scenario Type")
    
    args = parser.parse_args()
    
    start_date = datetime.strptime(args.start, "%Y-%m-%d")
    end_date = datetime.strptime(args.end, "%Y-%m-%d")
    tickers = args.tickers
    
    print(f"\n--- Starting Backtest Simulation [{args.scenario}] ---")
    print(f"Period: {start_date.date()} to {end_date.date()}")
    print(f"Assets: {tickers}")
    
    # Init Engine
    db = MagicMock() # Use Mock DB for now, or real session if available
    engine = BacktestEngine(db, tickers, start_date, end_date)
    
    # Inject Scenario Data if needed
    if args.scenario != "BASE":
        print(f"Injecting {args.scenario} Scenario Data...")
        # Generate 2 years of history BEFORE start_date for feature calc
        history_start = start_date - timedelta(days=730)
        gen = StressScenarioGenerator(tickers, history_start, end_date)
        if args.scenario == "CRASH":
            data = gen.generate_crash()
        elif args.scenario == "HIGH_VOL":
            data = gen.generate_high_vol_sideways()
            
        # Patch Engine's Data Client to return this synthetic data
        # We need a way to inject it.
        # Since `_fetch_daily_data` queries DB, we need to PAtch that method or populate DB.
        # Efficient way: Subclass Engine or Monkeypatch.
        
        def mock_fetch_daily(date):
            res = {}
            for t in tickers:
                if t in data and date in data[t].index:
                    row = data[t].loc[date]
                    res[t] = row.to_dict()
            return res
            
        engine._fetch_daily_data = mock_fetch_daily
        
        # Also need to patch `data_client.fetch_market_data` for the Quant Pipeline
        # But Quant Pipeline logic is complex. For Stress Test of *Rebalancer Logic*,
        # we care about the *Price Action* fed to Rebalancer.
        # The Rebalancer calls `fetch_market_data`.
        # We need to mock that too.
        
        def mock_fetch_market_data(db, tickers, period, end_date=None):
            # Return history up to end_date from synthetic data
            res = {}
            cutoff = end_date or datetime.utcnow()
            for t in tickers:
                if t in data:
                    # Slice
                    df = data[t]
                    mask = df.index <= cutoff
                    res[t] = df.loc[mask]
            return res
            
        engine.data_client.fetch_market_data = mock_fetch_market_data
        # CRITICAL: Also patch the pipeline's data client
        engine.pipeline.data_client.fetch_market_data = mock_fetch_market_data

    # Run Simulation
    equity_curve = engine.run()
    
    # Metrics
    if equity_curve:
        metrics = BacktestMetrics(equity_curve)
        print(metrics.generate_report())
        # print equity curve head/tail
        df = pd.DataFrame(equity_curve)
        print("\nEquity Curve Head:")
        print(df.head())
        print("\nEquity Curve Tail:")
        print(df.tail())
    else:
        print("No trades or data.")

if __name__ == "__main__":
    main()
