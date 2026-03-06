import sys
import os
import numpy as np
import pandas as pd
import logging
import unittest

# Ensure app is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.rebalancer.rebalance.mpt_solver import MPTSolver

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OptimizerHardeningTest")

class TestMPTHardening(unittest.TestCase):
    
    def setUp(self):
        np.random.seed(42)
        self.n_assets = 5
        self.tickers = [f"Asset_{i}" for i in range(self.n_assets)]
        self.returns = pd.DataFrame(
            np.random.normal(0.0005, 0.01, (252, self.n_assets)),
            columns=self.tickers
        )
        # Create a high vol asset
        self.returns['Asset_4'] = self.returns['Asset_4'] * 2.0

    def test_risk_parity(self):
        """Test Risk Parity produces lower weights for high vol assets"""
        logger.info("Testing Risk Parity...")
        solver = MPTSolver(self.returns)
        res = solver.maximize_risk_parity()
        
        self.assertTrue(res['success'])
        weights = res['weights']
        
        # Asset 4 has 2x Vol, so should have lower weight
        self.assertLess(weights['Asset_4'], weights['Asset_0'])
        logger.info(f"Risk Parity Weights: {weights}")
        
    def test_ledoit_wolf(self):
        """Test Ledoit Wolf covariance estimation runs"""
        logger.info("Testing Ledoit-Wolf Covariance...")
        solver = MPTSolver(self.returns, covariance_method="ledoit_wolf")
        res = solver.maximize_sharpe_ratio()
        self.assertTrue(res['success'])
        
    def test_constraints(self):
        """Test Max Weight Constraints"""
        logger.info("Testing Max Weight Constraints...")
        solver = MPTSolver(self.returns)
        # Cap at 25%
        res = solver.maximize_sharpe_ratio(max_weight=0.25)
        
        weights = np.array(list(res['weights'].values()))
        self.assertTrue(np.all(weights <= 0.2501))
        logger.info(f"Max Weight Found: {np.max(weights):.4f}")

    def test_regularization(self):
        """Test L2 Regularization promotes diversification"""
        logger.info("Testing L2 Regularization...")
        solver = MPTSolver(self.returns)
        
        # No Reg
        res_no_reg = solver.maximize_sharpe_ratio()
        w_no_reg = np.array(list(res_no_reg['weights'].values()))
        hhi_no_reg = np.sum(w_no_reg**2) # Herfindahl-Hirschman Index
        
        # High Reg
        res_reg = solver.maximize_sharpe_ratio(l2_reg=5.0)
        w_reg = np.array(list(res_reg['weights'].values()))
        hhi_reg = np.sum(w_reg**2)
        
        logger.info(f"HHI (No Reg): {hhi_no_reg:.4f} vs HHI (Reg): {hhi_reg:.4f}")
        self.assertLess(hhi_reg, hhi_no_reg)

if __name__ == '__main__':
    unittest.main()
