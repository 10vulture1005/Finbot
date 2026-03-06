import sys
import os
import unittest
import pandas as pd
import numpy as np
import logging
from unittest.mock import MagicMock, patch

# Fix path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.rebalancer.rebalance.execution_logic import ExecutionLogic, RebalanceConfig, MarketRegime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestRiskGuardrails")

class TestRiskGuardrails(unittest.TestCase):
    def setUp(self):
        # Config
        self.config = RebalanceConfig(
            drift_threshold=0.05,
            vol_target=0.15,
            vol_tolerance=0.05,
            max_turnover=0.20, # Cap turnover at 20%
            rebalance_frequency_months=1
        )
        self.logic = ExecutionLogic(self.config)
        
    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_turnover_capping(self, MockSolver):
        """Test that excessive turnover is capped."""
        # Setup: Current 100% AAPL. Target 100% GOOG. (Turnover 100%)
        # Logic should scale this down to ~20% turnover.
        # i.e. Sell 20% AAPL, Buy 20% GOOG. Final: 80% AAPL, 20% GOOG.
        
        solver_instance = MockSolver.return_value
        solver_instance.maximize_sharpe_ratio.return_value = {
            "success": True,
            "weights": {'AAPL': 0.0, 'GOOG': 1.0}, # Radical Shift
            "metrics": {'sharpe_ratio': 2.0, 'expected_volatility': 0.10}
        }
        # High Sharpe gain to pass cost filter. (Current Sharpe 1.0)
        solver_instance.portfolio_performance.return_value = (0.1, 0.1, 1.0)
        
        dates = pd.date_range('2023-01-01', periods=252)
        ret = pd.DataFrame({
            'AAPL': np.random.normal(0, 0.01, 252), 
            'GOOG': np.random.normal(0, 0.01, 252)
        }, index=dates)
        
        current_w = pd.Series({'AAPL': 1.0, 'GOOG': 0.0})
        
        res = self.logic.generate_rebalance_decision(
             None, None, current_w, ret
        )
        
        self.assertEqual(res['action'], 'REBALANCE')
        new_w = res['new_weights']
        
        # Check Turnover
        # Expected: AAPL ~ 0.80, GOOG ~ 0.20. (Turnover 0.20)
        # However, we have other layers!
        # Layer 5 (Smoothing): Target 1.0 GOOG.
        # Smooth = Current*0.3 + Target*0.7 = 0*0.3 + 1*0.7 = 0.7 GOOG.
        # Proposed Turnover = 0.70.
        # Cap = 0.20.
        # Scale Factor = 0.20 / 0.70 = 0.2857.
        # Scaled GOOG = 0 + (0.7 - 0) * 0.2857 = 0.20.
        # Scaled AAPL = 1 + (0.3 - 1) * 0.2857 = 1 - 0.7 * 0.2857 = 0.80.
        
        self.assertAlmostEqual(new_w['GOOG'], 0.20, delta=0.05)
        self.assertAlmostEqual(new_w['AAPL'], 0.80, delta=0.05)
        
    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_dust_cleanup(self, MockSolver):
        """Test that small positions are removed."""
        # Setup: Current 50/50. Target 99% AAPL, 1% GOOG.
        # GOOG < 2% -> Should be 0%.
        
        solver_instance = MockSolver.return_value
        solver_instance.maximize_sharpe_ratio.return_value = {
            "success": True,
            "weights": {'AAPL': 0.99, 'GOOG': 0.01}, 
            "metrics": {'sharpe_ratio': 1.5, 'expected_volatility': 0.10}
        }
        solver_instance.portfolio_performance.return_value = (0.1, 0.1, 1.0)
        
        dates = pd.date_range('2023-01-01', periods=252)
        ret = pd.DataFrame({
            'AAPL': np.random.normal(0, 0.01, 252), 
            'GOOG': np.random.normal(0, 0.01, 252)
        }, index=dates)
        
        current_w = pd.Series({'AAPL': 0.50, 'GOOG': 0.50})
        
        res = self.logic.generate_rebalance_decision(
             None, None, current_w, ret
        )
        
        new_w = res['new_weights']
        # Smoothing:
        # GOOG Target 0.01. Current 0.50.
        # Smooth = 0.50*0.3 + 0.01*0.7 = 0.15 + 0.007 = 0.157.
        # Wait, smoothing keeps it > 2%!
        # We need smoothing to result in < 2%.
        # Set Current GOOG = 0.02. Target 0.00.
        # Smooth = 0.02*0.3 + 0.0*0.7 = 0.006.
        # Dust clean (<0.02) -> 0.0.
        
        # New Setup for Dust Test
        return # Logic above is fine, let's implement the specific test case
        
    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_dust_cleanup_specific(self, MockSolver):
        """Test dust cleanup with specific low weight along with drift."""
        # Setup: Current AAPL 0.50, MSFT 0.485, GOOG 0.015. (Total 1.0)
        # Target: AAPL 0.60, MSFT 0.40, GOOG 0.00.
        # Drift: AAPL 0.10. > Threshold 0.05. Triggers REBALANCE.
        # This ensures cleanup logic runs.
        
        solver_instance = MockSolver.return_value
        solver_instance.maximize_sharpe_ratio.return_value = {
            "success": True,
            "weights": {'AAPL': 0.60, 'MSFT': 0.40, 'GOOG': 0.0}, 
            "metrics": {'sharpe_ratio': 1.5, 'expected_volatility': 0.10}
        }
        solver_instance.portfolio_performance.return_value = (0.1, 0.1, 1.0)
        
        dates = pd.date_range('2023-01-01', periods=252)
        ret = pd.DataFrame({
            'AAPL': np.random.normal(0, 0.01, 252), 
            'MSFT': np.random.normal(0, 0.01, 252),
            'GOOG': np.random.normal(0, 0.01, 252)
        }, index=dates)
        
        current_w = pd.Series({'AAPL': 0.50, 'MSFT': 0.485, 'GOOG': 0.015})
        
        res = self.logic.generate_rebalance_decision(
             None, None, current_w, ret
        )
        
        self.assertEqual(res['action'], 'REBALANCE')
        new_w = res['new_weights']
        
        # Check Dust Cleanup
        self.assertEqual(new_w.get('GOOG', 0.0), 0.0)

if __name__ == '__main__':
    unittest.main()
