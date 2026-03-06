import sys
import os
import numpy as np
import pandas as pd
import logging
import time

# Ensure app is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.rebalancer.rebalance.mpt_solver import MPTSolver

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("Benchmark")

def benchmark():
    logger.info("--- Performance Benchmark ---")
    logger.info(f"{'Assets':<10} | {'Method':<20} | {'Time (ms)':<10} | {'Status':<10}")
    logger.info("-" * 60)
    
    sizes = [10, 30, 50, 100]
    
    for n in sizes:
        # Generate Data
        tickers = [f"A_{i}" for i in range(n)]
        returns = pd.DataFrame(
            np.random.normal(0.0005, 0.015, (252, n)),
            columns=tickers
        )
        
        solver = MPTSolver(returns, covariance_method="ledoit_wolf")
        
        # Test Max Sharpe
        start = time.time()
        res = solver.maximize_sharpe_ratio()
        end = time.time()
        duration_ms = (end - start) * 1000
        logger.info(f"{n:<10} | {'Max Sharpe':<20} | {duration_ms:<10.2f} | {'OK' if duration_ms < 500 else 'SLOW'}")
        
        # Test Risk Parity
        start = time.time()
        res = solver.maximize_risk_parity()
        end = time.time()
        duration_ms = (end - start) * 1000
        logger.info(f"{n:<10} | {'Risk Parity':<20} | {duration_ms:<10.2f} | {'OK' if duration_ms < 500 else 'SLOW'}")

if __name__ == "__main__":
    benchmark()
