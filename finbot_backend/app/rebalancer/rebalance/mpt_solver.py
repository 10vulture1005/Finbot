import numpy as np
import pandas as pd
from scipy.optimize import minimize
try:
    from sklearn.covariance import LedoitWolf
except ImportError:
    LedoitWolf = None

class MPTSolver:
    """
    Modern Portfolio Theory Solver using Scipy Optimize.
    Supports:
    - Mean-Variance Optimization (Max Sharpe)
    - Minimum Volatility
    - Risk Parity (Equal Risk Contribution)
    - Robust Covariance (Ledoit-Wolf)
    - Weight Constraints & Regularization
    """
    def __init__(self, returns_window: pd.DataFrame, risk_free_rate: float = 0.05, 
                 covariance_method: str = "sample", expected_returns: pd.Series = None,
                 confidence_scores: pd.Series = None):
        self.returns = returns_window
        self.risk_free_rate = risk_free_rate
        self.covariance_method = covariance_method
        self.tickers = self.returns.columns.tolist()
        self.num_assets = len(self.tickers)
        
        # Mean Returns: Use ML predictions if available, else historical
        if expected_returns is not None and not expected_returns.empty:
            # Align with tickers
            aligned_preds = expected_returns.reindex(self.tickers).fillna(0.0)
            
            # Apply Confidence Scaling (Shrinkage)
            if confidence_scores is not None:
                aligned_conf = confidence_scores.reindex(self.tickers).fillna(0.5) # Default 0.5 confidence
                self.mean_returns = aligned_preds * aligned_conf
            else:
                # Default Shrinkage if no confidence provided
                self.mean_returns = aligned_preds * 0.5
        else:
            self.mean_returns = self.returns.mean() * 252 # Annualized returns
            
        self.cov_matrix = self._get_covariance_matrix()

    def _get_covariance_matrix(self):
        """
        Computes covariance matrix based on selected method.
        """
        if self.covariance_method == "ledoit_wolf" and LedoitWolf is not None:
            try:
                # Shrinkage covariance
                lw = LedoitWolf()
                # fit expects (n_samples, n_features)
                lw.fit(self.returns)
                # Annualize
                return pd.DataFrame(lw.covariance_ * 252, index=self.tickers, columns=self.tickers)
            except Exception:
                # Fallback to sample if LW fails
                return self.returns.cov() * 252
        else:
            # Standard Sample Covariance
            return self.returns.cov() * 252

    def portfolio_performance(self, weights):
        """
        Calculates the expected return and volatility for a given set of weights.
        """
        returns = np.sum(self.mean_returns * weights)
        std_dev = np.sqrt(np.dot(weights.T, np.dot(self.cov_matrix, weights)))
        return returns, std_dev

    def negative_sharpe_ratio(self, weights, l2_reg=0.0):
        """
        Objective function to minimize (negative Sharpe Ratio).
        Includes L2 Regularization: -Sharpe + lambda * sum(w^2)
        """
        p_ret, p_var = self.portfolio_performance(weights)
        if p_var < 1e-6: # Avoid division by zero
             p_var = 1e-6
             
        sharpe = (p_ret - self.risk_free_rate) / p_var
        
        # Penalize concentration (L2 norm)
        penalty = l2_reg * np.sum(weights**2)
        
        return -sharpe + penalty

    def negative_sharpe_jac(self, weights, l2_reg=0.0):
        """
        Analytical Jacobian (Gradient) of Negative Sharpe Ratio.
        Speeds up optimization significantly.
        """
        p_ret = np.sum(self.mean_returns * weights)
        cov_w = np.dot(self.cov_matrix, weights)
        p_var = np.sqrt(np.dot(weights.T, cov_w))
        
        if p_var < 1e-6:
            p_var = 1e-6
            
        # Gradient of Sharpe = (mu * sigma - (mu*w - rf) * (Sigma*w / sigma)) / sigma^2
        # Gradient of Neg Sharpe is negative of that.
        # Plus L2 Reg gradient: 2 * lambda * w
        
        numerator = (self.mean_returns * p_var) - (p_ret - self.risk_free_rate) * (cov_w / p_var)
        grad_sharpe = numerator / (p_var**2)
        
        grad_penalty = 2 * l2_reg * weights
        
        return -grad_sharpe + grad_penalty

    def minimize_volatility_objective(self, weights, l2_reg=0.0):
        """
        Objective function to minimize (Volatility).
        """
        _, p_var = self.portfolio_performance(weights)
        
        penalty = l2_reg * np.sum(weights**2)
        
        return p_var + penalty

    def risk_parity_objective(self, weights):
        """
        Objective function for Risk Parity (Equal Risk Contribution).
        Minimizes the variance of risk contributions.
        RC_i = w_i * (Sigma * w)_i
        Loss = sum((RC_i - RC_j)^2)
        """
        # Portfolio volatility
        portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(self.cov_matrix, weights)))
        
        # Avoid division by zero
        if portfolio_volatility < 1e-6:
            portfolio_volatility = 1e-6

        # Marginal Risk Contribution: d(sigma)/dw = (Sigma * w) / sigma
        mrc = np.dot(self.cov_matrix, weights) / portfolio_volatility
        
        # Risk Contribution: w_i * MRC_i
        rc = weights * mrc
        
        # Target Risk Contribution (Equal)
        target_rc = portfolio_volatility / self.num_assets
        
        # Sum of squared errors - Multiplied by 1000 for better scaling in optimizer
        return np.sum((rc - target_rc)**2) * 1000

    def maximize_sharpe_ratio(self, min_weight=0.0, max_weight=1.0, l2_reg=0.0):
        """
        Finds the portfolio weights that maximize the Sharpe Ratio.
        """
        return self._optimize(self.negative_sharpe_ratio, min_weight, max_weight, args=(l2_reg,), jac=self.negative_sharpe_jac)

    def minimize_volatility(self, min_weight=0.0, max_weight=1.0, l2_reg=0.0):
        """
        Finds the portfolio weights that minimize Volatility.
        """
        return self._optimize(self.minimize_volatility_objective, min_weight, max_weight, args=(l2_reg,))

    def maximize_risk_parity(self, min_weight=0.0, max_weight=1.0):
        """
        Finds the Risk Parity portfolio (Equal Risk Contribution).
        """
        return self._optimize(self.risk_parity_objective, min_weight, max_weight)

    def _optimize(self, objective_function, min_weight, max_weight, args=(), jac=None):
        """
        Internal optimization helper.
        """
        num_assets = self.num_assets
        constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        bounds = tuple((min_weight, max_weight) for _ in range(num_assets))
        
        # Initial guess (equal weights)
        init_guess = num_assets * [1. / num_assets,]

        result = minimize(objective_function, init_guess, args=args, jac=jac,
                          method='SLSQP', bounds=bounds, constraints=constraints,
                          tol=1e-8, options={'ftol': 1e-9})
        
        return self._format_result(result)

    def _format_result(self, result):
        """
        Formats the optimization result into a dictionary.
        """
        if not result.success:
            return {
                "success": False,
                "message": result.message,
                "weights": {}
            }
        
        weights = result.x
        
        # Normalize if close to 1 (fix solver precision issues)
        if abs(np.sum(weights) - 1.0) < 1e-3:
            weights = weights / np.sum(weights)
            
        formatted_weights = {self.tickers[i]: round(weights[i], 4) for i in range(self.num_assets)}
        
        p_ret, p_vol = self.portfolio_performance(weights)
        
        # Safely calc Sharpe
        if p_vol < 1e-6:
            sr = 0.0
        else:
            sr = (p_ret - self.risk_free_rate) / p_vol

        return {
            "success": True,
            "weights": formatted_weights,
            "metrics": {
                "expected_return": round(p_ret, 4),
                "expected_volatility": round(p_vol, 4),
                "sharpe_ratio": round(sr, 4)
            }
        }
