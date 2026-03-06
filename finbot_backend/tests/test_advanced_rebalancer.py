import sys
import os
import unittest
import pandas as pd
import numpy as np
import logging
from unittest.mock import MagicMock, patch

# Fix path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.rebalancer.rebalance.execution_logic import ExecutionLogic, RebalanceConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestAdvancedRebalancer")

class TestAdvancedRebalancer(unittest.TestCase):
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
        # Dummy returns
        dates = pd.date_range('2023-01-01', periods=30)
        self.dummy_returns = pd.DataFrame({'AAPL': 0.0, 'GOOG': 0.0}, index=dates)

    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_dynamic_drift_threshold(self, MockSolver):
        """Test that drift threshold widens in high volatility."""
        # Setup Mock
        solver_instance = MockSolver.return_value
        solver_instance.maximize_sharpe_ratio.return_value = {
            "success": True,
            "weights": {'AAPL': 0.50, 'GOOG': 0.50}, # Ideal
            "metrics": {'sharpe_ratio': 1.0, 'expected_volatility': 0.20}
        }
        solver_instance.minimize_volatility.return_value = {
             "success": True,
             "weights": {'AAPL': 0.50, 'GOOG': 0.50},
             "metrics": {'sharpe_ratio': 1.0, 'expected_volatility': 0.20}
        }
        
        # Scenario: High Volatility
        dates = pd.date_range('2023-01-01', periods=252)
        high_vol_ret = pd.DataFrame({
            'AAPL': np.random.normal(0, 0.03, 252), # ~48% vol
            'GOOG': np.random.normal(0, 0.03, 252)
        }, index=dates)
        
        # Current Weights: Drift 10%
        current_w = pd.Series({'AAPL': 0.60, 'GOOG': 0.40})
        
        res = self.logic.generate_rebalance_decision(
            None, None, current_w, high_vol_ret
        )
        
        # Expect HOLD because Threshold > Drift
        self.assertEqual(res['action'], 'HOLD')
        self.assertIn("Drift", res['reason'])

    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_tax_aware_filter(self, MockSolver):
        """Test that STCG positions are sold less aggressively."""
        # Setup Mock
        solver_instance = MockSolver.return_value
        solver_instance.maximize_sharpe_ratio.return_value = {
            "success": True,
            "weights": {'AAPL': 0.50, 'GOOG': 0.50}, 
            "metrics": {'sharpe_ratio': 2.0, 'expected_volatility': 0.10}
        }
        solver_instance.portfolio_performance.return_value = (0.1, 0.1, 1.0) 

        # Low Vol Data
        dates = pd.date_range('2023-01-01', periods=252)
        low_vol_ret = pd.DataFrame({
            'AAPL': np.random.normal(0, 0.01, 252), 
            'GOOG': np.random.normal(0, 0.01, 252)
        }, index=dates)
        
        # Current: 90% AAPL.
        current_w = pd.Series({'AAPL': 0.90, 'GOOG': 0.10})
        
        # STCG Holding
        holdings_stcg = [{'symbol': 'AAPL', 'quantity': 10, 'days_held': 30}]
        
        res = self.logic.generate_rebalance_decision(
             None, None, current_w, low_vol_ret, holdings_data=holdings_stcg
        )
         
        self.assertEqual(res['action'], 'REBALANCE')
        
        w_new = res['new_weights']['AAPL']
        self.assertLess(w_new, 0.85)
        self.assertGreater(w_new, 0.65)

    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_turnover_constraint(self, MockSolver):
        """Test cost-benefit filter."""
        # Setup Mock
        solver_instance = MockSolver.return_value
        # Ideal Target: 50/50. Sharpe 1.002 (Tiny improvement)
        solver_instance.maximize_sharpe_ratio.return_value = {
            "success": True,
            "weights": {'AAPL': 0.50, 'GOOG': 0.50}, 
            "metrics": {'sharpe_ratio': 1.002, 'expected_volatility': 0.10} 
        }
        # Current Performance: Sharpe 1.0
        # Return, Vol, Sharpe
        solver_instance.portfolio_performance.return_value = (0.1, 0.1, 1.0) 

        # Low Vol Data (Market Vol ~ 16%)
        dates = pd.date_range('2023-01-01', periods=252)
        low_vol_ret = pd.DataFrame({
            'AAPL': np.random.normal(0, 0.01, 252), 
            'GOOG': np.random.normal(0, 0.01, 252)
        }, index=dates)

        # Current: 100% AAPL
        current_w = pd.Series({'AAPL': 1.00, 'GOOG': 0.00})
        
        res = self.logic.generate_rebalance_decision(
             None, None, current_w, low_vol_ret
        )
        
        # Calculation:
        # Sharpe Gain = 0.002.
        # Return Gain = 0.002 * 0.10 = 0.0002 (0.02%).
        # Cost Pct ~ 0.20%. Turnover 0.5. Total Cost ~ 0.10%.
        # Gain (0.02%) < Cost (0.10%) -> HOLD.
        
        self.assertEqual(res['action'], 'HOLD')
        self.assertIn("Efficiency", res['reason'])

if __name__ == '__main__':
    unittest.main()
