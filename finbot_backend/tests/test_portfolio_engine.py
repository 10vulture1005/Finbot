import sys
import os
import numpy as np
import pandas as pd
import logging
import unittest
import time

# Ensure app is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.rebalancer.rebalance.mpt_solver import MPTSolver

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger("PortfolioEngineTests")

class TestPortfolioEngine(unittest.TestCase):
    
    def setUp(self):
        np.random.seed(42)
        self.n_assets = 10
        self.tickers = [f"Asset_{i}" for i in range(self.n_assets)]
        # Generate 2 years of data
        self.returns = pd.DataFrame(
            np.random.normal(0.0005, 0.015, (504, self.n_assets)),
            columns=self.tickers
        )
        
        # Inject realistic properties:
        # Asset_0 is low vol (Bond-like)
        self.returns['Asset_0'] = self.returns['Asset_0'] * 0.2
        # Asset_1 and Asset_2 are highly correlated
        self.returns['Asset_2'] = self.returns['Asset_1'] * 0.95 + np.random.normal(0, 0.001, 504)
        
        self.solver = MPTSolver(self.returns)

    def test_01_constraints(self):
        """Verify Weight Constraints (Sum=1, Bounds)"""
        logger.info("\n--- TEST: Constraints ---")
        
        # Test Case 1: Max Weight 15%
        res = self.solver.maximize_sharpe_ratio(max_weight=0.15)
        self.assertTrue(res['success'])
        weights = np.array(list(res['weights'].values()))
        
        self.assertAlmostEqual(np.sum(weights), 1.0, places=3, msg="Sum of weights must be 1.0")
        self.assertTrue(np.all(weights >= -1e-4), "No negative weights")
        self.assertTrue(np.all(weights <= 0.151), "Max weight violation")
        logger.info(f"Max Weight Constraint (15%) Verified. Max found: {np.max(weights):.4f}")
        
    def test_02_risk_parity(self):
        """Verify Risk Parity Logic"""
        logger.info("\n--- TEST: Risk Parity ---")
        res = self.solver.maximize_risk_parity()
        self.assertTrue(res['success'])
        
        weights = res['weights']
        # Bond (Asset_0) should have high weight
        # High correl pair (Asset 1, 2) should have moderate/low weights individually?
        # Actually Risk Parity allocates inversely to marginal risk.
        
        w_bond = weights['Asset_0']
        avg_w = np.mean(list(weights.values()))
        
        logger.info(f"Bond Weight: {w_bond:.4f}, Avg Weight: {avg_w:.4f}")
        self.assertGreater(w_bond, avg_w * 1.5, "Low vol asset should have significantly higher weight in Risk Parity")

    def test_03_numerical_sanity(self):
        """Numerical Sanity Checks (NaN, Inf, Convergence)"""
        logger.info("\n--- TEST: Numerical Sanity ---")
        
        methods = [
            self.solver.maximize_sharpe_ratio,
            self.solver.minimize_volatility,
            self.solver.maximize_risk_parity
        ]
        
        for method in methods:
            res = method()
            self.assertTrue(res['success'], f"Solver failed for {method.__name__}")
            metrics = res['metrics']
            
            # Check for NaNs
            self.assertFalse(np.isnan(metrics['expected_return']), "Return is NaN")
            self.assertFalse(np.isnan(metrics['expected_volatility']), "Vol is NaN")
            self.assertFalse(np.isnan(metrics['sharpe_ratio']), "Sharpe is NaN")
            
            # Check for Inf
            self.assertFalse(np.isinf(metrics['sharpe_ratio']), "Sharpe is Inf")
            
    def test_04_stress_test_crash(self):
        """Stress Test: Market Crash Scenario (High Vol, High Corr)"""
        logger.info("\n--- TEST: Stress Test (Crash) ---")
        
        # Simulate Crash: Vol increases 5x, Corr -> 1.0
        crash_data = self.returns.copy() * 5.0
        # Force high correlation
        avg_ret = crash_data.mean(axis=1)
        for col in crash_data.columns:
            # mix 80% market, 20% idiosyncratic
            crash_data[col] = avg_ret * 0.8 + crash_data[col] * 0.2
            
        crash_solver = MPTSolver(crash_data, covariance_method="ledoit_wolf") # Use robust cov
        
        res = crash_solver.minimize_volatility(max_weight=0.2) # Defensive
        
        self.assertTrue(res['success'], "Solver failed under crash conditions!")
        
        weights = list(res['weights'].values())
        max_w = np.max(weights)
        logger.info(f"Crash Scenario Solved. Max Weight: {max_w:.4f}")
        self.assertLessEqual(max_w, 0.2001)

    def test_05_sensitivity_stability(self):
        """Sensitivity Analysis & Stability Score"""
        logger.info("\n--- TEST: Sensitivity & Stability ---")
        
        # Sensitivity Analysis with Regularization and Robust Covariance
        self.solver = MPTSolver(self.returns, covariance_method="ledoit_wolf")
        base_res = self.solver.maximize_sharpe_ratio(l2_reg=2.0)
        base_w = np.array(list(base_res['weights'].values()))
        
        # Perturb returns by random noise (Small drift)
        noise = np.random.normal(0, 0.0001, self.n_assets) # 0.01% daily ~ 2.5% annual
        
        perturb_data = self.returns.copy()
        for i, tick in enumerate(self.tickers):
             perturb_data[tick] = perturb_data[tick] + noise[i]
             
        p_solver = MPTSolver(perturb_data, covariance_method="ledoit_wolf")
        p_res = p_solver.maximize_sharpe_ratio(l2_reg=2.0)
        p_w = np.array(list(p_res['weights'].values()))
        
        # Turnover / Delta
        delta = np.sum(np.abs(p_w - base_w))
        logger.info(f"Total Weight Delta from Noise: {delta:.4f}")
        
        stability_score = 1.0 - min(delta, 1.0)
        logger.info(f"Stability Score: {stability_score:.2f}")
        
        self.assertLess(delta, 0.4, "Optimizer is too sensitive to small noise!")

if __name__ == '__main__':
    unittest.main()
