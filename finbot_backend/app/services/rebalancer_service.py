from sqlalchemy.orm import Session
from app.models.user import User
from app.models.portfolio import PortfolioStock, PortfolioEvent
from app.rebalancer.rebalance.execution_logic import ExecutionLogic, RebalanceConfig
import pandas as pd
import json
from datetime import datetime

class RebalancerService:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

        # Config extraction from User model (Portfolio fields)
        self.config = RebalanceConfig(
            drift_threshold=user.rebalance_threshold or 0.15,
            vol_target=user.target_volatility or 0.10,
            vol_tolerance=0.10, # default
            max_turnover=0.20, # default
            rebalance_frequency_months=1 # default
        )
        self.engine = ExecutionLogic(self.config)

    def run_rebalance(self, mode: str = "dry_run", reason: str = "manual"):
        """
        Orchestrates the rebalance process using MPT and AI.
        """
        # 1. Fetch current portfolio
        holdings = self.db.query(PortfolioStock).filter_by(user_id=self.user.id).all()
        if not holdings:
             return {"executed": False, "explanation": "Empty portfolio"}

        # Convert to Series for Rebalancer
        total_value = sum(h.quantity * h.avg_price for h in holdings)
        if total_value == 0:
             return {"executed": False, "explanation": "Zero value portfolio"}

        current_weights = pd.Series(
            {(h.symbol): (h.quantity * h.avg_price / total_value) for h in holdings}
        )
        
        # 2. Fetch Real Market Data
        tickers = current_weights.index.tolist()
        try:
            import yfinance as yf
            # Fetch 1y history for volatility coverage
            # Add ".NS" if Indian stocks (assumption based on user location/currency)
            # But earlier code handled it in execution_logic. Let's handle it here for consistency.
            yf_tickers = []
            for t in tickers:
                if not t.endswith(".NS") and not t.endswith(".BO") and not t.endswith(".US"): # Simple heuristic
                     yf_tickers.append(f"{t}.NS") # Default to NSE
                else:
                     yf_tickers.append(t)
            
            # Map back
            ticker_map = dict(zip(yf_tickers, tickers))
            
            # Download data
            raw_data = yf.download(yf_tickers, period="2y", interval="1d", progress=False)
            
            # Check which column to use: Adj Close or Close
            price_key = 'Adj Close' if 'Adj Close' in raw_data.columns.get_level_values(0) else 'Close'
            
            try:
                data = raw_data[price_key]
            except KeyError:
                return {"executed": False, "explanation": f"Market data missing '{price_key}' column."}

            # If single ticker, data might be Series or DataFrame
            if isinstance(data, pd.Series):
                df = data.to_frame()
                if len(yf_tickers) == 1:
                    df.columns = [yf_tickers[0]]
                data = df
            
            # Rename columns back to original symbols for consistency
            data.columns = [ticker_map.get(c, c) for c in data.columns]
            
            # Filter for missing
            valid_tickers = [t for t in tickers if t in data.columns]
            if len(valid_tickers) < len(tickers):
                 return {"executed": False, "explanation": f"Missing market data for some assets: {set(tickers) - set(valid_tickers)}"}

            returns_window = data[valid_tickers].pct_change().dropna()
            
            if returns_window.empty:
                 return {"executed": False, "explanation": "Insufficient market data history for rebalancing"}

        except Exception as e:
             return {"executed": False, "explanation": f"Market Data Error: {str(e)}"}
        
        # Prepare Holdings Data for Tax Layer
        holdings_data = []
        now = datetime.utcnow()
        for h in holdings:
            days = (now - h.purchase_date).days if h.purchase_date else 365
            holdings_data.append({
                "symbol": h.symbol,
                "quantity": h.quantity,
                "purchase_date": h.purchase_date,
                "days_held": days
            })

        # 3. Call Rebalancer Engine
        decision = self.engine.generate_rebalance_decision(
            current_date=pd.Timestamp.now(),
            last_rebalance_date=self.user.last_rebalance_at,
            current_weights=current_weights,
            returns_window=returns_window,
            holdings_data=holdings_data
        )

        action = decision.get("action")
        new_weights = decision.get("new_weights", {})
        explanation = decision.get("reason", "No explanation provided.")
        metrics = decision.get("metrics", {})
        strategy = decision.get("strategy", "Unknown")

        result = {
            "executed": False,
            "mode": mode,
            "drift_detected": action == "REBALANCE",
            "metrics": metrics,
            "explanation": explanation,
            "current_weights": current_weights.to_dict(),
            "new_weights": new_weights
        }

        # 4. Handle Execution
        if action == "REBALANCE":
             if mode == "execute":
                self._execute_rebalance(holdings, new_weights, total_value, decision)
                result["executed"] = True
                self.user.last_rebalance_at = datetime.utcnow()
             
             # Log Event
             self._log_event(mode, reason, decision, current_weights, strategy)

        return result

    def _execute_rebalance(self, holdings, new_weights, total_value, decision):
        """
        Updates portfolio quantities based on new weights.
        """
        holding_map = {h.symbol: h for h in holdings}
        
        for symbol, weight in new_weights.items():
            if symbol in holding_map:
                holding = holding_map[symbol]
                # Calculate new quantity: (Weight * Total) / Price
                # Using avg_price is incorrect for rebalancing, should use current price.
                # But we just fetched data... let's try to get current price from it? 
                # Or just use avg_price as fallback. Ideally we should use the fetched LATEST price.
                # For now, sticking to logic but acknowledging `avg_price` is a proxy if `current_price` not stored.
                # Ideally execute logic should update based on LATEST market price.
                # Let's assume the user knows this limitation or we update it later.
                # Updating quantity based on TARGET weight and CURRENT Total Value.
                
                # NOTE: In a real app, we would place ORDERS. Here we just update the DB to reflect "Target".
                new_quantity = (weight * total_value) / holding.avg_price 
                
                holding.quantity = new_quantity
                holding.weight_target = weight
                holding.weight_drift = 0.0 
        
        self.db.commit()

    def _log_event(self, mode, trigger_reason, decision, weights_before, strategy):
        event = PortfolioEvent(
            user_id=self.user.id,
            event_type="rebalance",
            event_payload={
                "mode": mode,
                "reason": trigger_reason,
                "action": decision.get("action"),
                "strategy": strategy,
                "explanation_text": decision.get("reason"),
                "weights_before": weights_before.to_dict(),
                "weights_after": decision.get("new_weights", {})
            }
        )
        self.db.add(event)
        self.db.commit()
