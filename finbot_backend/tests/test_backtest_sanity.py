import unittest
from unittest.mock import MagicMock, patch, ANY
from datetime import datetime, timedelta
import pandas as pd
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.backtest.engine import BacktestEngine
from app.backtest.accountant import PortfolioAccountant

class TestBacktestSanity(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.tickers = ['AAPL', 'MSFT']
        self.start_date = datetime(2023, 1, 1)
        self.end_date = datetime(2023, 2, 1) # 1 Month run
        
        # Patch DataClient and Pipeline
        self.patcher_data = patch('app.backtest.engine.QuantitativeDataClient')
        self.patcher_pipeline = patch('app.backtest.engine.QuantPipeline')
        
        self.MockDataClient = self.patcher_data.start()
        self.MockPipeline = self.patcher_pipeline.start()
        
        # Setup Data Client Mock
        self.data_client_instance = self.MockDataClient.return_value
        
        # Mock Market Data for 2 years (history) + 1 month (sim)
        dates = pd.date_range(self.start_date - timedelta(days=730), self.end_date)
        self.mock_df_aapl = pd.DataFrame({
            'Open': 100.0, 'Close': 101.0, 'High': 102.0, 'Low': 99.0, 'Volume': 1000
        }, index=dates)
        self.mock_df_msft = pd.DataFrame({
            'Open': 200.0, 'Close': 202.0, 'High': 205.0, 'Low': 198.0, 'Volume': 1000
        }, index=dates)
        
        # Return dict of DFs
        self.data_client_instance.fetch_market_data.return_value = {
            'AAPL': self.mock_df_aapl,
            'MSFT': self.mock_df_msft
        }
        
    def tearDown(self):
        self.patcher_data.stop()
        self.patcher_pipeline.stop()

    def test_engine_initialization(self):
        engine = BacktestEngine(self.mock_db, self.tickers, self.start_date, self.end_date)
        self.assertIsInstance(engine.accountant, PortfolioAccountant)
        self.assertEqual(engine.current_date, self.start_date)

    @patch('app.backtest.engine.BacktestEngine._fetch_daily_data')
    def test_simulation_loop_run(self, mock_fetch_daily):
        """
        Verify the loop runs and calls process_day.
        """
        engine = BacktestEngine(self.mock_db, self.tickers, self.start_date, self.end_date)
        
        # Mock daily data return
        mock_fetch_daily.return_value = {
            'AAPL': {'Open': 150, 'Close': 155, 'High': 160, 'Low': 140, 'Volume': 1000},
            'MSFT': {'Open': 250, 'Close': 255, 'High': 260, 'Low': 240, 'Volume': 1000}
        }
        
        equity_curve = engine.run()
        
        # Should run for approx 20 trading days
        self.assertGreater(len(equity_curve), 15) 
        # Check that first date is close to start date (e.g. within 3 days if weekend)
        self.assertLess((equity_curve[0]['date'] - self.start_date).days, 4)

    @patch('app.backtest.engine.BacktestEngine._fetch_daily_data')
    @patch('app.rebalancer.rebalance.execution_logic.ExecutionLogic.generate_rebalance_decision')
    def test_rebalance_trigger_and_execution(self, mock_decision, mock_fetch_daily):
        """
        Verify rebalance is triggered, orders generated, and executed.
        """
        engine = BacktestEngine(self.mock_db, self.tickers, self.start_date, self.end_date)
        
        # Force rebalance at start
        engine.last_rebalance = self.start_date - timedelta(days=40)
        
        mock_fetch_daily.return_value = {
            'AAPL': {'Open': 100, 'Close': 100, 'High': 100, 'Low': 100, 'Volume': 1000},
            'MSFT': {'Open': 200, 'Close': 200, 'High': 200, 'Low': 200, 'Volume': 1000}
        }
        
        # Mock Decision: Buy AAPL (Target 50%), Hold MSFT (Target 50%)
        # Current Portfolio is empty (Cash 100k).
        # Target: AAPL 50k, MSFT 50k.
        mock_decision.return_value = {
            'action': 'REBALANCE',
            'new_weights': {'AAPL': 0.5, 'MSFT': 0.5},
            'reason': 'Initial Allocation'
        }
        
        # Run 2 steps manually to control flow
        
        # Day 1: Rebalance Triggered -> Orders Queued
        engine._process_day()
        
        # Check Decision called
        mock_decision.assert_called()
        
        # Check Orders Queued
        # AAPL: 50k / 100 = 500 shares
        # MSFT: 50k / 200 = 250 shares
        self.assertEqual(len(engine.pending_orders), 2)
        print(f"\nPending Orders: {engine.pending_orders}")
        
        # Day 2: Execution at Open
        engine.current_date += timedelta(days=1)
        engine._process_day()
        
        # Orders should be empty now
        self.assertEqual(len(engine.pending_orders), 0)
        
        # Check Holdings in Accountant
        holdings = engine.accountant.get_holdings_summary()
        self.assertIn('AAPL', holdings)
        self.assertIn('MSFT', holdings)
        self.assertAlmostEqual(holdings['AAPL'], 500, delta=1) # Allow slight slip/comm diff logic

if __name__ == '__main__':
    unittest.main()
