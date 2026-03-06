import pandas as pd
import numpy as np
from app.rebalancer.rebalance.mpt_solver import MPTSolver

# Create dummy data
# Asset A: Low risk, low return
# Asset B: High risk, high return
# Asset C: Inverse to B

np.random.seed(42)
dates = pd.date_range(start="2023-01-01", periods=100)
a_returns = np.random.normal(0.0005, 0.01, 100) # Mean 0.05%, Vol 1%
b_returns = np.random.normal(0.001, 0.03, 100)  # Mean 0.1%, Vol 3%
c_returns = -0.5 * b_returns + np.random.normal(0, 0.01, 100) # Negative corr with B

df = pd.DataFrame({
    "A": a_returns,
    "B": b_returns,
    "C": c_returns
}, index=dates)

print("Returns Head:")
print(df.head())

solver = MPTSolver(df)

print("\n--- Minimize Volatility ---")
min_vol = solver.minimize_volatility()
print(min_vol)

print("\n--- Maximize Sharpe ---")
max_sharpe = solver.maximize_sharpe_ratio()
print(max_sharpe)
