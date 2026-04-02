import numpy as np
import pandas as pd
from scipy.optimize import minimize

class RiskMPT:
    """
    Mathematical solver for minimum-variance portfolio.
    Implements Steps 1 to 4 of the Risk-Reducing Rebalancer.
    """
    def __init__(self, prices: pd.DataFrame, max_weight: float = 0.20):
        """
        prices: DataFrame of daily Adjusted Close prices shape (T, N)
        Expects at least 252 trading days (~1 year).
        """
        self.tickers = prices.columns.tolist()
        self.num_assets = len(self.tickers)
        self.max_weight = max_weight
        
        # STEP 1: Compute daily log returns: r_t = ln(P_t / P_t-1)
        self.log_returns = np.log(prices / prices.shift(1)).dropna()
        
        # Compute mean return vector and covariance matrix (Annualized, 252 days)
        self.mean_returns = self.log_returns.mean() * 252
        self.cov_matrix = self.log_returns.cov() * 252

    def portfolio_variance(self, weights):
        """
        STEP 2: Portfolio variance: σ² = wᵀ Σ w
        """
        return np.dot(weights.T, np.dot(self.cov_matrix, weights))

    def portfolio_volatility(self, weights):
        return np.sqrt(self.portfolio_variance(weights))
        
    def optimize(self):
        """
        STEP 4: Optimize using Sequential Least Squares Programming.
        Minimizes portfolio variance subject to constraints.
        """
        if self.num_assets == 0:
            return {}
            
        if self.num_assets == 1:
            return {self.tickers[0]: 1.0}
            
        # STEP 3: CONSTRAINTS
        # 1. Fully invested constraint: sum(w_i) = 1
        constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        
        # 2. Long-only constraint: w_i >= 0
        # 3. Optional max weight constraint: w_i <= max_weight
        # Check mathematically possible: if max_weight * N < 1, you can't sum to 1.
        if self.max_weight * self.num_assets < 1.0:
            # Relax to equal weight plus a tiny buffer if max_weight is too restrictive
            dynamic_max = (1.0 / self.num_assets) + 0.05
            bounds = tuple((0.0, dynamic_max) for _ in range(self.num_assets))
        else:
            bounds = tuple((0.0, self.max_weight) for _ in range(self.num_assets))
        
        # Initial guess (equal weights)
        init_guess = np.array([1.0 / self.num_assets] * self.num_assets)
        
        # Run optimization
        result = minimize(
            self.portfolio_variance, 
            init_guess,
            method='SLSQP', 
            bounds=bounds, 
            constraints=constraints,
            tol=1e-8
        )
        
        if not result.success:
            raise ValueError(f"Optimization failed: {result.message}")
            
        weights = result.x
        
        # Cleanup small rounding errors
        weights = np.clip(weights, 0, 1)
        weights = weights / np.sum(weights)
        
        return {self.tickers[i]: float(weights[i]) for i in range(self.num_assets)}

    def get_metrics(self, weights_dict, risk_free_rate=0.0):
        """
        STEP 9: Risk Validation metrics.
        Compute expected return, volatility, sharpe ratio, and max drawdown.
        """
        w = np.array([weights_dict.get(t, 0.0) for t in self.tickers])
        
        vol = self.portfolio_volatility(w)
        ret = np.dot(w.T, self.mean_returns)
        
        sharpe = (ret - risk_free_rate) / vol if vol > 1e-6 else 0.0
        
        # Historical simulated daily returns
        port_returns = self.log_returns.dot(w)
        # Convert log returns back to simple returns for cumprod
        simple_returns = np.exp(port_returns) - 1
        cum_returns = (1 + simple_returns).cumprod()
        peak = cum_returns.cummax()
        drawdown = (cum_returns - peak) / peak
        max_drawdown = drawdown.min()
        
        return {
            "expected_return": float(ret),
            "expected_volatility": float(vol),
            "sharpe_ratio": float(sharpe),
            "max_drawdown": float(max_drawdown)
        }
