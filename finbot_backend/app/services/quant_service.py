from app.quant_engine.pipeline import QuantPipeline
from app.models.user import User
from sqlalchemy.orm import Session
import logging
import pandas as pd
import numpy as np
import os
import sys

# Import the portfolio-rebalancer classes/functions
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
portfolio_rebalancer_path = os.path.join(project_root, "portfolio-rebalancer")
sys.path.append(portfolio_rebalancer_path)

try:
    from portfolio import Portfolio, Asset
    from rebalance import full_rebalance
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to import from portfolio-rebalancer in quant_service. Path: {portfolio_rebalancer_path}")
    raise
    
logger = logging.getLogger(__name__)

class QuantService:
    _pipeline = None

    @classmethod
    def get_pipeline(cls):
        if cls._pipeline is None:
            # Lazy loading to avoid startup delay
            cls._pipeline = QuantPipeline()
        return cls._pipeline

    def run_analysis(self, db: Session, user: User):
        """
        Runs the MPTSolver to generate minimum-volatility target weights,
        then feeds those into the deterministic rebalancer for trade suggestions.
        """
        from app.models.portfolio import PortfolioStock
        import yfinance as yf
        from app.rebalancer.rebalance.mpt_solver import MPTSolver
        
        holdings = db.query(PortfolioStock).filter_by(user_id=user.id).all()
        
        if not holdings:
            return {
                "status": "error",
                "message": "Portfolio is empty. Add stocks to run analysis."
            }
        
        try:
            tickers = [h.symbol for h in holdings]
            yf_tickers = [t + ".NS" if not (t.endswith(".NS") or t.endswith(".BO") or t.endswith(".US")) else t for t in tickers]
            
            # Fetch 1-year Historical Data for Volatility Optimization
            data = yf.download(yf_tickers, period="1y", interval="1d", progress=False)
            
            if data.empty:
                return {"status": "error", "message": "Failed to fetch historical market data for optimization."}
                
            price_key = 'Adj Close' if 'Adj Close' in data.columns else 'Close'
            prices_df = data[price_key]
            
            if isinstance(prices_df, pd.Series):
                prices_df = prices_df.to_frame()
                prices_df.columns = [yf_tickers[0]]
                
            # Rename columns back to original symbols
            ticker_map = dict(zip(yf_tickers, tickers))
            prices_df.columns = [ticker_map.get(c, c) for c in prices_df.columns]
            
            # Calculate daily returns
            returns_window = prices_df.pct_change().dropna()
            
            # Current Latest Prices
            latest_prices = {}
            for sym, yf_sym in zip(tickers, yf_tickers):
                try:
                    # Ticker.fast_info is more reliable for current instant
                    ticker_obj = yf.Ticker(yf_sym)
                    latest_prices[sym] = ticker_obj.fast_info.last_price
                except:
                    latest_prices[sym] = prices_df[sym].iloc[-1] if sym in prices_df.columns else 1000.0

            # Use fallback for any missing
            for h in holdings:
                if h.symbol not in latest_prices:
                    latest_prices[h.symbol] = h.avg_price

            # Run MPT Solver to Minimize Risk/Volatility
            solver = MPTSolver(returns_window)
            max_weight = max(0.30, 1.0 / len(holdings) + 0.10)
            
            optimization_result = solver.minimize_volatility(max_weight=max_weight)
            if not optimization_result["success"]:
                return {"status": "error", "message": f"Optimization failed: {optimization_result['message']}"}

            optimal_target_weights = optimization_result["weights"]
            metrics = optimization_result["metrics"]

            # Build Portfolio and Asset objects for the engine based on MPT Targets
            portfolio = Portfolio()
            
            holding_map = {}
            total_value = 0.0
            
            for h in holdings:
                holding_map[h.symbol] = h
                price = latest_prices.get(h.symbol, h.avg_price)
                total_value += h.quantity * price
                
                target_alloc = optimal_target_weights.get(h.symbol, 0.0) * 100.0
                
                asset = Asset(h.symbol, h.quantity, "INR", target_alloc)
                asset.group = "Equities"
                asset.adjust = 1
                portfolio.add_asset(asset)

            # Calculate current weights before rebalance
            current_weights = {h.symbol: ((h.quantity * latest_prices.get(h.symbol, h.avg_price)) / total_value) if total_value > 0 else 0 for h in holdings}

            # Run deterministic engine to get exact target quantites based on MPT
            suggestions = full_rebalance(
                portfolio, 
                latest_prices, 
                "INR", 
                use_ceil=False, 
                distribute_across_adjustables=True
            )
            
            # Calculate final target static weights from the suggestions
            target_quantities = {}
            for h in holdings:
                target_quantities[h.symbol] = h.quantity
                
            for s in suggestions:
                target_quantities[s["ticker"]] = s["to"]

            target_weights = {}
            details = []
            
            for sym, tgt_q in target_quantities.items():
                price = latest_prices.get(sym, 1.0)
                target_val = tgt_q * price
                target_w = target_val / total_value if total_value > 0 else 0.0
                target_weights[sym] = target_w
                
                details.append({
                    "symbol": sym,
                    "weight": target_w,
                    "current_weight": current_weights.get(sym, 0.0),
                    "reasoning": f"Optimized to minimize portfolio volatility (Expected Vol: {metrics['expected_volatility']:.2%})",
                    "probability": 1.0,
                    "price": price
                })

            result = {
                "weights": target_weights,
                "details": details,
                "expected_return": metrics["expected_return"],
                "expected_volatility": metrics["expected_volatility"],
                "sharpe_ratio": metrics["sharpe_ratio"]
            }

            return {
                "status": "success",
                "data": result,
                "message": "Minimum volatility analysis complete."
            }
            
        except Exception as e:
            logger.error(f"Quant analysis failed: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    def execute_rebalance(self, db: Session, user: User, target_weights: dict):
        """
        Applies the target weights (generated by deterministic full_rebalance)
        to the user's portfolio.
        """
        from app.models.portfolio import PortfolioStock
        import yfinance as yf

        # 1. Get Current Portfolio & Total Value
        holdings = db.query(PortfolioStock).filter_by(user_id=user.id).all()
        
        total_value = 0.0
        holding_map = {h.symbol: h for h in holdings}
        all_symbols = list(set([h.symbol for h in holdings] + list(target_weights.keys())))
        yf_symbols = [s + ".NS" if not (s.endswith(".NS") or s.endswith(".BO") or s.endswith(".US")) else s for s in all_symbols]
        
        price_map = {}
        try:
            for sym, yf_sym in zip(all_symbols, yf_symbols):
                try:
                    ticker = yf.Ticker(yf_sym)
                    price_map[sym] = ticker.fast_info.last_price
                except:
                    pass
        except Exception as e:
            logger.error(f"Price fetch failed: {e}")

        # Calculate Total Value using latest prices (fallback to avg_price)
        for h in holdings:
            price = price_map.get(h.symbol, h.avg_price)
            total_value += h.quantity * price

        if total_value <= 0:
             return {
                 "status": "error",
                 "message": "Portfolio value is 0. Please add stocks or funds before rebalancing."
             }
        
        executed_trades = []
        current_symbols = set(holding_map.keys())
        target_symbols = set(target_weights.keys())
        
        # A. Remove/Sell completely if not in target or weight is 0
        for sym in current_symbols:
            if sym not in target_symbols or target_weights[sym] <= 0:
                db.delete(holding_map[sym])
                executed_trades.append(f"SELL ALL {sym}")

        # B. Add/Update Target stocks
        for sym, weight in target_weights.items():
            if weight <= 0:
                continue
                
            price = price_map.get(sym, 1000.0) # Default fallback
            if price <= 0: price = 1000.0
            
            target_amt = total_value * weight
            new_qty = target_amt / price
            
            if sym in holding_map:
                h = holding_map[sym]
                # Log execution text simply
                if h.quantity < new_qty:
                     executed_trades.append(f"BUY {sym}: {new_qty - h.quantity:.2f} units")
                elif h.quantity > new_qty:
                     executed_trades.append(f"SELL {sym}: {h.quantity - new_qty:.2f} units")
                     
                h.quantity = new_qty
            else:
                new_stock = PortfolioStock(
                    user_id=user.id,
                    symbol=sym,
                    quantity=new_qty,
                    avg_price=price,
                    weight_target=weight
                )
                db.add(new_stock)
                executed_trades.append(f"BUY {sym}: {new_qty:.2f} units")
        
        db.commit()
        
        return {
            "status": "success",
            "trades": executed_trades,
            "message": "Portfolio rebalanced successfully."
        }

    def get_technical_indicators(self, db: Session, ticker: str):
        pipeline = self.get_pipeline()
        
        # We need historical data to calculate technicals correctly
        market_data_dict = pipeline.data_client.fetch_market_data(db, [ticker], period="1y")
        
        if not market_data_dict or ticker not in market_data_dict or market_data_dict[ticker].empty:
             return {
                 "status": "error",
                 "message": f"No market data found for {ticker}."
             }
             
        df = market_data_dict[ticker]
        
        try:
            df_features = pipeline.feature_eng.compute_technical_features(df)
            
            # The last row contains the most recent indicator values
            latest = df_features.iloc[-1]
            
            def safe_float(val):
                if pd.isna(val) or np.isnan(val) or np.isinf(val):
                    return None
                return float(val)

            indicators = {
                "symbol": ticker,
                "close": safe_float(latest.get("Close")),
                "volume": safe_float(latest.get("Volume")),
                "ema_50": safe_float(latest.get("EMA_50")),
                "ema_200": safe_float(latest.get("EMA_200")),
                "rsi": safe_float(latest.get("RSI")),
                "macd": safe_float(latest.get("MACD")),
                "macd_signal": safe_float(latest.get("MACD_Signal")),
                "bb_up": safe_float(latest.get("BB_UP")),
                "bb_low": safe_float(latest.get("BB_LOW")),
                "bb_width": safe_float(latest.get("BB_Width")),
                "vol_20d": safe_float(latest.get("Vol_20d")),  # Annualized
                "vol_60d": safe_float(latest.get("Vol_60d")),
                "ret_5d": safe_float(latest.get("Ret_5d")),
                "ret_20d": safe_float(latest.get("Ret_20d")),
                "vol_surge": safe_float(latest.get("Vol_Surge")),
            }
            
            return {
                "status": "success",
                "data": indicators
            }
        except Exception as e:
            logger.error(f"Failed to compute indicators for {ticker}: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
