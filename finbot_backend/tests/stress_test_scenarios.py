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
logger = logging.getLogger("StressTest")

class TestStressScenarios(unittest.TestCase):
    def setUp(self):
        self.config = RebalanceConfig(
            drift_threshold=0.05,
            vol_target=0.15,
            vol_tolerance=0.05,
            max_turnover=0.20,
            rebalance_frequency_months=1
        )
        self.logic = ExecutionLogic(self.config)

    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_crash_scenario_2020(self, MockSolver):
        """Simulate a COVID-like crash (Feb-March 2020).
        Market drops 30% in 20 days. Volatility spikes to 80%.
        Expect: Regime = BEAR or HIGH_VOL. Strategy = MIN_VOL. Action = DEFENSIVE.
        """
        solver_instance = MockSolver.return_value
        # Solver should recommend Minimum Volatility Portfolio
        solver_instance.minimize_volatility.return_value = {
            "success": True,
            "weights": {'SAFE': 1.0, 'RISY': 0.0}, 
            "metrics": {'sharpe_ratio': 0.5, 'expected_volatility': 0.10}
        }
        solver_instance.maximize_sharpe_ratio.return_value = {
            "success": True,
            "weights": {'SAFE': 0.5, 'RISKY': 0.5},
            "metrics": {'sharpe_ratio': 0.8, 'expected_volatility': 0.40}
        }
        # Current Performance (Suffering)
        solver_instance.portfolio_performance.return_value = (-0.30, 0.50, -0.6)

        # Create Crash Data
        dates = pd.date_range('2020-01-01', periods=60)
        # First 40 days stable, last 20 days crash
        stable_ret = np.random.normal(0, 0.01, 40)
        crash_ret = np.random.normal(-0.02, 0.05, 20) # -2% daily mean, 5% vol (approx 80% annualized)
        rets = np.concatenate([stable_ret, crash_ret])
        
        crash_df = pd.DataFrame({
            'SAFE': np.random.normal(0, 0.01, 60), # Bonds?
            'RISKY': rets
        }, index=dates)
        
        current_w = pd.Series({'SAFE': 0.40, 'RISKY': 0.60})

        res = self.logic.generate_rebalance_decision(
            None, None, current_w, crash_df
        )

        print(f"\nCRASH Test Regime: {res.get('strategy')}")
        
        # Expect Regime Detection to catch this
        regime_in_strategy = "BEAR" in res['strategy'] or "HIGH_VOL" in res['strategy']
        self.assertTrue(regime_in_strategy, f"Failed to detect crash regime. Strategy: {res['strategy']}")
        
        # Expect Move towards SAFE (Min Vol)
        # Logic chooses strategy. If Bear/HighVol -> MinVol.
        # MinVol weights: SAFE 1.0.
        # Current SAFE 0.40.
        # Should buy SAFE.
        self.assertGreater(res['new_weights']['SAFE'], 0.40)

    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_bull_run_2021(self, MockSolver):
        """Simulate a steady bull run.
        Market rises, Low Vol.
        Expect: Regime = BULL. Strategy = MAX_SHARPE.
        """
        solver_instance = MockSolver.return_value
        solver_instance.maximize_sharpe_ratio.return_value = {
            "success": True,
            "weights": {'GROWTH': 0.8, 'VALUE': 0.2},
            "metrics": {'sharpe_ratio': 2.5, 'expected_volatility': 0.15}
        }
        solver_instance.portfolio_performance.return_value = (0.1, 0.1, 1.5)
        
        dates = pd.date_range('2021-01-01', periods=120)
        # Steady rise
        bull_ret = pd.DataFrame({
            'GROWTH': np.random.normal(0.002, 0.01, 120), # ~50% annualized return
            'VALUE': np.random.normal(0.001, 0.008, 120)
        }, index=dates)
        
        current_w = pd.Series({'GROWTH': 0.50, 'VALUE': 0.50})
        
        res = self.logic.generate_rebalance_decision(
            None, None, current_w, bull_ret
        )
        
        print(f"\nBULL Test Regime: {res.get('strategy')}")
        
        self.assertIn("Maximum Sharpe Ratio", res['strategy'])
        self.assertIn("BULL", res['strategy'])
        
    @patch('app.rebalancer.rebalance.execution_logic.MPTSolver')
    def test_tax_protection_holding(self, MockSolver):
        """Verify that positions held < 1 year with gains are NOT sold aggressively."""
        solver_instance = MockSolver.return_value
        solver_instance.maximize_sharpe_ratio.return_value = {
            "success": True,
            "weights": {'WINNER': 0.0, 'LOSER': 1.0}, # Max Sharpe says dump winner
            "metrics": {'sharpe_ratio': 1.5, 'expected_volatility': 0.15}
        }
        solver_instance.portfolio_performance.return_value = (0.1, 0.1, 1.0)
        
        dates = pd.date_range('2023-01-01', periods=252)
        ret = pd.DataFrame({
            'WINNER': np.random.normal(0.001, 0.01, 252), 
            'LOSER': np.random.normal(0, 0.01, 252)
        }, index=dates)
        
        # Current: 100% Winner.
        current_w = pd.Series({'WINNER': 1.0, 'LOSER': 0.0})
        # Held for 6 months (180 days)
        holdings = [{'symbol': 'WINNER', 'quantity': 100, 'days_held': 180}]
        
        res = self.logic.generate_rebalance_decision(
             None, None, current_w, ret, holdings_data=holdings
        )
        
        # Max Sharpe wants WINNER -> 0.0.
        # Tax Logic (STCG) should cap sell at 50%.
        # So Target -> 0.5 * (0.0 - 1.0) + 1.0 = 0.50.
        # Smoothing (0.3 old, 0.7 target) -> 0.3*1.0 + 0.7*0.50 = 0.3 + 0.35 = 0.65.
        
        print(f"\nTAX Test Winner Weight: {res['new_weights']['WINNER']}")
        self.assertGreater(res['new_weights']['WINNER'], 0.40) # Ensure we didn't dump it all
        
if __name__ == '__main__':
    unittest.main()
