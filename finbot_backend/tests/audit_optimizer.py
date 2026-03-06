import sys
import os
import numpy as np
import pandas as pd
import logging

# Ensure app is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.rebalancer.rebalance.mpt_solver import MPTSolver

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OptimizerAudit")

def generate_synthetic_data(n_assets=5, n_days=252, correlation=0.5, seed=42):
    np.random.seed(seed)
    mean_returns = np.random.normal(0.0005, 0.001, n_assets)
    cov = np.eye(n_assets) * 0.0002
    # Add correlation
    for i in range(n_assets):
        for j in range(i+1, n_assets):
            cov[i, j] = cov[j, i] = 0.0002 * correlation
            
    returns = np.random.multivariate_normal(mean_returns, cov, n_days)
    tickers = [f"Asset_{i}" for i in range(n_assets)]
    return pd.DataFrame(returns, columns=tickers)

def audit_mathematical_correctness():
    logger.info("--- 1. Mathematical Correctness Audit ---")
    data = generate_synthetic_data()
    solver = MPTSolver(data, risk_free_rate=0.0)
    
    # Check Annualization
    logger.info(f"Annualization Factor Used: {solver.cov_matrix.iloc[0,0] / data.cov().iloc[0,0]:.2f} (Expected 252.0)")
    
    # Check Sharpe Calculation manually
    weights = np.array([0.2] * 5)
    ret, vol = solver.portfolio_performance(weights)
    calc_sharpe = (ret - 0.05) / vol # assuming rf=0.05 default in solver
    logger.info(f"Manual Sharpe: {calc_sharpe:.4f}")
    
    res = solver.maximize_sharpe_ratio()
    logger.info(f"Optimized Sharpe: {res['metrics']['sharpe_ratio']:.4f}")
    
    if res['metrics']['sharpe_ratio'] < calc_sharpe:
         logger.error("!! Optimized Sharpe is lower than Equal Weight! Solver failed.")
    else:
         logger.info("Optimizer improved Sharpe ratio.")

def audit_constraints():
    logger.info("\n--- 2. Constraints Audit ---")
    data = generate_synthetic_data()
    solver = MPTSolver(data)
    res = solver.maximize_sharpe_ratio()
    
    weights = np.array(list(res['weights'].values()))
    
    # Sum = 1
    sum_w = np.sum(weights)
    logger.info(f"Sum of weights: {sum_w:.6f} (Target 1.0)")
    if abs(sum_w - 1.0) > 1e-4:
        logger.error("!! Fully Invested Constraint Violated !!")
        
    # Bounds [0, 1]
    min_w = np.min(weights)
    max_w = np.max(weights)
    logger.info(f"Min Weight: {min_w:.6f}, Max Weight: {max_w:.6f}")
    if min_w < -1e-4 or max_w > 1.0001:
        logger.error("!! Long-only / Upper Bound Constraint Violated !!")

def audit_numerical_stability():
    logger.info("\n--- 3. Numerical Stability Audit ---")
    
    # Case A: Perfectly Correlated Assets (Singular Matrix)
    logger.info("Testing Perfectly Correlated Assets...")
    n_days = 252
    asset1 = np.random.normal(0.001, 0.02, n_days)
    asset2 = asset1 * 1.000001 # Almost identical
    df = pd.DataFrame({'A': asset1, 'B': asset2})
    
    solver = MPTSolver(df)
    res = solver.maximize_sharpe_ratio()
    logger.info(f"Singular Matrix Result: Success={res['success']}")
    logger.info(f"Weights: {res['weights']}")
    
    # Case B: Large Scale Differences
    logger.info("Testing Scale Differences...")
    asset3 = np.random.normal(0.001, 0.02, n_days) * 1000 # Mis-scaled? No, returns are pct change.
    # Actually if users pass prices instead of returns...
    
    # Case C: Zero Vol Asset
    logger.info("Testing Zero Volatility Asset (Cash-like)...")
    asset_cash = np.zeros(n_days) + 0.0001 # Constant small return
    df_cash = pd.DataFrame({'Stock': asset1, 'Cash': asset_cash})
    solver_c = MPTSolver(df_cash)
    res_c = solver_c.maximize_sharpe_ratio()
    logger.info(f"Zero Vol Result: Success={res_c['success']}")
    logger.info(f"Weights: {res_c['weights']}")


def audit_sensitivity():
    logger.info("\n--- 4. Sensitivity Analysis ---")
    data = generate_synthetic_data(seed=42)
    solver = MPTSolver(data)
    base_res = solver.maximize_sharpe_ratio()
    base_w = np.array(list(base_res['weights'].values()))
    
    # Perturb one asset's return by tiny amount
    data_mod = data.copy()
    # Artificial return boost for Asset_0
    # Note: MPTSolver calculates mean from data. We need to modify data.
    # Let's just modify the mean in the solver directly for the test
    solver.mean_returns.iloc[0] *= 1.01 # 1% increase in expected return
    
    mod_res = solver.maximize_sharpe_ratio()
    mod_w = np.array(list(mod_res['weights'].values()))
    
    diff = np.abs(mod_w - base_w).sum()
    logger.info(f"Total Weight Shift from 1% return change: {diff:.4f}")
    if diff > 0.5:
        logger.warning("!! High Sensitivity Detected !!")

if __name__ == "__main__":
    audit_mathematical_correctness()
    audit_constraints()
    audit_numerical_stability()
    audit_sensitivity()
