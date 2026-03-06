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
logger = logging.getLogger("TestRegimeRebalancer")

class TestRegimeRebalancer(unittest.TestCase):
    def setUp(self):
        # Config
        self.config = RebalanceConfig(
            drift_threshold=0.05,
            vol_target=0.15,
            vol_tolerance=0.05,
            max_turnover=0.20,
            rebalance_frequency_months=1
        )
        self.logic = ExecutionLogic(self.config)
        self.current_weights = pd.Series({'AAPL': 0.50, 'GOOG': 0.50})

    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_regime_detection_high_vol(self, MockSolver):
        """Test High Volatility Regime detection and strategy switch."""
        solver_instance = MockSolver.return_value
        solver_instance.minimize_volatility.return_value = {
             "success": True, "weights": {'AAPL': 0.50, 'GOOG': 0.50}, "metrics": {'sharpe_ratio': 1.0}
        }
        
        # High Vol Data (Std > 0.20 annualized)
        dates = pd.date_range('2023-01-01', periods=252)
        high_vol_ret = pd.DataFrame({
            'AAPL': np.random.normal(0, 0.03, 252), # ~48% vol
            'GOOG': np.random.normal(0, 0.03, 252)
        }, index=dates)
        
        # Current Weights (Drift 10% - 0.60 vs 0.50)
        current_w = pd.Series({'AAPL': 0.60, 'GOOG': 0.40})
        
        res = self.logic.generate_rebalance_decision(
            None, None, current_w, high_vol_ret
        )
        
        # 1. Check Strategy Name
        self.assertIn("Minimum Volatility", res['strategy'])
        self.assertIn("HIGH_VOL", res['strategy'])
        
        # 2. Check Action (Should be HOLD due to widened threshold)
        # Drift 10%. Threshold Base 5% * Factor 2.4 = 12%. -> HOLD.
        self.assertEqual(res['action'], 'HOLD')

    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_regime_detection_bear(self, MockSolver):
        """Test Bear Market detection (Drawdown > 20%)."""
        solver_instance = MockSolver.return_value
        solver_instance.minimize_volatility.return_value = {
             "success": True, "weights": {'AAPL': 0.50, 'GOOG': 0.50}, "metrics": {'sharpe_ratio': 1.0}
        }
        
        # Bear Market Data: Low Vol but consistent negative trend leading to drawdown
        # Create a cumulative product path that drops 25%
        dates = pd.date_range('2023-01-01', periods=252)
        # Daily return -0.1% approx to get -25% over a year
        bear_ret = pd.DataFrame({
            'AAPL': np.full(252, -0.0012), 
            'GOOG': np.full(252, -0.0012)
        }, index=dates)
        # Add tiny noise to avoid singular matrix if solver runs real math (mocked anyway)
        bear_ret += np.random.normal(0, 0.001, bear_ret.shape)
        
        current_w = pd.Series({'AAPL': 0.50, 'GOOG': 0.50})
        
        res = self.logic.generate_rebalance_decision(
            None, None, current_w, bear_ret
        )
        
        # Check Strategy: Defensive because Bear
        self.assertIn("Minimum Volatility", res['strategy'])
        self.assertIn("BEAR", res['strategy'])

    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_regime_detection_bull(self, MockSolver):
        """Test Bull Market detection (Default)."""
        solver_instance = MockSolver.return_value
        solver_instance.maximize_sharpe_ratio.return_value = {
             "success": True, "weights": {'AAPL': 0.50, 'GOOG': 0.50}, "metrics": {'sharpe_ratio': 2.0}
        }
        
        # Bull Market: Positive returns, Low Vol
        dates = pd.date_range('2023-01-01', periods=252)
        bull_ret = pd.DataFrame({
            'AAPL': np.random.normal(0.001, 0.01, 252), 
            'GOOG': np.random.normal(0.001, 0.01, 252)
        }, index=dates)
        
        current_w = pd.Series({'AAPL': 0.50, 'GOOG': 0.50})
        
        res = self.logic.generate_rebalance_decision(
            None, None, current_w, bull_ret
        )
        
        # Check Strategy: Sharpe because Bull
        self.assertIn("Maximum Sharpe Ratio", res['strategy'])
        self.assertIn("BULL", res['strategy'])

if __name__ == '__main__':
    unittest.main()
