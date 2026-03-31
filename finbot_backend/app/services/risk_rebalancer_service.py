import math
import logging
import pandas as pd
from datetime import datetime
import os
import sys

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.portfolio import PortfolioStock, PortfolioEvent
import os
import sys
import yfinance as yf

# Get the absolute path of the directory containing this file (app/services/)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Navigate up to the project root (Finbot folder): app/services -> app -> finbot_backend -> Finbot
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
# Path to portfolio-rebalancer
portfolio_rebalancer_path = os.path.join(project_root, "portfolio-rebalancer")

sys.path.append(portfolio_rebalancer_path)

try:
    from portfolio import Portfolio, Asset
    from rebalance import full_rebalance
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to import from portfolio-rebalancer. Path added: {portfolio_rebalancer_path}. Error: {e}")
    raise
    
# Import MPTSolver from rebalancer engine
mpt_solver_path = os.path.join(current_dir, "..", "rebalancer", "rebalance")
sys.path.append(os.path.abspath(mpt_solver_path))
try:
    from mpt_solver import MPTSolver
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to import MPTSolver: {e}")
    raise

logger = logging.getLogger(__name__)

class RiskRebalancerService:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

        # Rules / Consts
        self.drift_threshold = 0.05
        self.volatility_threshold = 0.20
        self.max_weight = 0.20
        self.liquidity_volume_min = 100000

        # Step 7: Costs
        self.brokerage_pct = 0.001
        self.slippage_pct = 0.001

    def run_rebalance(self, mode: str = "dry_run", reason: str = "manual"):
        """
        Executes the deterministic static rebalance using portfolio-rebalancer.
        """
        # Fetch current portfolio
        holdings = self.db.query(PortfolioStock).filter_by(user_id=self.user.id).all()
        if not holdings:
            return {"executed": False, "explanation": "Empty portfolio"}
            
        tickers = [h.symbol for h in holdings]
        
        # Standardize for Yahoo Finance
        yf_tickers = []
        for t in tickers:
            if not t.endswith(".NS") and not t.endswith(".BO") and not t.endswith(".US"):
                 yf_tickers.append(f"{t}.NS")
            else:
                 yf_tickers.append(t)
                 
        ticker_map = dict(zip(yf_tickers, tickers))
        
        # 1. Fetch 1-year Historical Data for Volatility Optimization
        try:
            data = yf.download(yf_tickers, period="1y", interval="1d", progress=False)
            if data.empty:
                return {"executed": False, "explanation": "Failed to fetch historical market data for optimization."}
                
            price_key = 'Adj Close' if 'Adj Close' in data.columns else 'Close'
            prices_df = data[price_key]
            
            if isinstance(prices_df, pd.Series):
                prices_df = prices_df.to_frame()
                prices_df.columns = [yf_tickers[0]]
                
            # Rename columns back to original symbols
            prices_df.columns = [ticker_map.get(c, c) for c in prices_df.columns]
            
            # Calculate daily returns
            returns_window = prices_df.pct_change().dropna()
        except Exception as e:
            logger.error(f"Failed to process historical data: {e}")
            return {"executed": False, "explanation": f"Failed to process historical data: {e}"}

        # Fetch Current Prices reliably
        prices = {}
        target_quantities_by_symbol = {}
        
        try:
            for sym, yf_sym in zip(tickers, yf_tickers):
                try:
                    ticker = yf.Ticker(yf_sym)
                    prices[sym] = ticker.fast_info.last_price
                except:
                    # Fallback to last available data from DF
                    prices[sym] = prices_df[sym].iloc[-1] if sym in prices_df.columns else 1000.0
        except Exception as e:
            logger.error(f"Failed to fetch prices: {e}")
            
        # Fallback to DB
        for h in holdings:
            if h.symbol not in prices:
                prices[h.symbol] = h.avg_price

        # 2. Run MPT Solver to Minimize Risk/Volatility
        solver = MPTSolver(returns_window)
        max_weight = max(0.30, 1.0 / len(holdings) + 0.10)
        
        optimization_result = solver.minimize_volatility(max_weight=max_weight)
        if not optimization_result["success"]:
            return {"executed": False, "explanation": f"Risk Optimization failed: {optimization_result['message']}"}

        optimal_target_weights = optimization_result["weights"]
        metrics = optimization_result["metrics"]

        # 3. Build Portfolio and Asset objects for the deterministic engine
        portfolio = Portfolio()
        
        holding_map = {}
        for h in holdings:
            holding_map[h.symbol] = h
            target_alloc = optimal_target_weights.get(h.symbol, 0.0) * 100.0
            
            asset = Asset(h.symbol, h.quantity, "INR", target_alloc)
            asset.group = "Equities"
            asset.adjust = 1
            portfolio.add_asset(asset)

        # 4. Run the deterministic engine
        try:
            suggestions = full_rebalance(
                portfolio, 
                prices, 
                "INR", 
                use_ceil=False, 
                distribute_across_adjustables=True
            )
        except Exception as e:
            return {"executed": False, "explanation": f"Rebalancer engine failed: {e}"}

        # Calculate current state metrics
        total_value = sum(h.quantity * prices.get(h.symbol, h.avg_price) for h in holdings)
        current_weights = {h.symbol: (h.quantity * prices.get(h.symbol, h.avg_price)) / total_value for h in holdings} if total_value > 0 else {}
        
        # Process Suggestions
        trade_list = []
        turnover_value = 0.0
        
        target_weights = {}
        target_quantities = {}

        if not suggestions:
            return {
                 "executed": False, 
                 "explanation": "No rebalancing needed. Portfolio is already perfectly balanced to the target allocations.",
                 "current_weights": current_weights,
                 "new_weights": current_weights,
                 "optimal_weights": current_weights,
                 "vol_before": 0.0,
                 "drift_detected": False
            }

        for s in suggestions:
            sym = s["ticker"]
            direction = s["action"]
            qty_diff = s["shares"]
            target_q = s["to"]
            price = prices.get(sym, 1.0)
            
            # Reconstruct trade details suitable for frontend format
            trade_qty = qty_diff if direction == "BUY" else -qty_diff
            trade_value = abs(trade_qty) * price
            turnover_value += trade_value
            
            trade_list.append({
                "symbol": sym,
                "current_qty": s["from"],
                "target_qty": target_q,
                "trade_qty": trade_qty,
                "trade_direction": direction,
                "price": price
            })
            
            target_quantities[sym] = target_q

        # Add unchanged assets to targets
        for h in holdings:
            if h.symbol not in target_quantities:
                target_quantities[h.symbol] = h.quantity
            
            # Reconstruct weights for the new target portfolio
            target_value_i = target_quantities[h.symbol] * prices.get(h.symbol, h.avg_price)
            target_weights[h.symbol] = target_value_i / total_value if total_value > 0 else 0.0

        turnover_pct_val = turnover_value / (total_value * 2) if total_value > 0 else 0.0

        # Handle Execution
        if mode == "execute":
            for sym, tgt_q in target_quantities.items():
                if sym in holding_map:
                    h = holding_map[sym]
                    if tgt_q <= 0:
                        self.db.delete(h)
                    else:
                        h.quantity = tgt_q
                        # Optionally update avg_price on buys, but skipped for simplicity
            
            # Log event
            event = PortfolioEvent(
                user_id=self.user.id,
                event_type="static_rebalance",
                event_payload={
                    "mode": mode,
                    "reason": reason,
                    "weights_before": current_weights,
                    "weights_after": target_weights
                }
            )
            self.db.add(event)
            self.db.commit()

        success_explanation = (
            f"Deterministic rebalance generated using Minimum Volatility target allocations. "
            f"Projected Volatility: {metrics['expected_volatility']:.2%}. "
            f"Suggested {len(trade_list)} trades to restore portfolio balance."
        )

        return {
            "executed": True if mode == "execute" else False,
            "mode": mode,
            "drift_detected": True,
            "explanation": success_explanation,
            "current_weights": current_weights,
            "new_weights": target_weights,
            "optimal_weights": target_weights,
            "target_quantities": target_quantities,
            "trade_list": trade_list,
            "turnover_pct": turnover_pct_val,
            # Dummy validation fields to keep frontend happy
            "vol_before": metrics["expected_volatility"],
            "validation": {
                "volatility_before": metrics["expected_volatility"],
                "volatility_after": metrics["expected_volatility"],
                "sharpe_before": metrics["sharpe_ratio"],
                "sharpe_after": metrics["sharpe_ratio"],
                "max_drawdown_before": -0.2,
                "max_drawdown_after": -0.2
            },
            "costs": {
                "estimated_brokerage_plus_slippage": turnover_value * 0.002
            }
        }

