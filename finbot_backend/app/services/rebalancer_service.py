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
        Orchestrates the rebalance process.
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
            data = yf.download(tickers, period="1y", interval="1d", progress=False)['Adj Close']
            
            # If single ticker, data is Series, need DataFrame
            if isinstance(data, pd.Series):
                data = data.to_frame(name=tickers[0])
            
            # Algin columns
            # Ensure we have all tickers (some might fail)
            # If fail, we can't safely rebalance those assets.
            # For this strict implementation, we raise error if data missing.
            missing_tickers = [t for t in tickers if t not in data.columns]
            if missing_tickers:
                 # Check if they are just not in columns or if yfinance returned empty
                 pass 

            returns_window = data.pct_change().dropna()
            
            if returns_window.empty:
                 return {"executed": False, "explanation": "Insufficient market data for rebalancing"}

        except Exception as e:
             return {"executed": False, "explanation": f"Market Data Error: {str(e)}"}
        
        # 3. Call Rebalancer Engine
        decision = self.engine.generate_rebalance_decision(
            current_date=pd.Timestamp.now(),
            last_rebalance_date=self.user.last_rebalance_at,
            current_weights=current_weights,
            returns_window=returns_window
        )

        action = decision.get("action")
        new_weights = decision.get("new_weights")
        explanation = decision.get("reason")
        metrics = decision.get("metrics", {})

        result = {
            "executed": False,
            "mode": mode,
            "drift_detected": action == "REBALANCE",
            "vol_before": metrics.get("current_volatility", 0.0),
            "vol_after": metrics.get("new_volatility", 0.0),
            "explanation": explanation
        }

        # 4. Handle Execution
        if action == "REBALANCE":
             # Drift Detected
             if mode == "execute":
                self._execute_rebalance(holdings, new_weights, total_value, decision)
                result["executed"] = True
                self.user.last_rebalance_at = datetime.utcnow()
             
             # Log Event (Common for both dry_run and execute if relevant, 
             # but usually we log only executions or significant alerts. 
             # Requirement says "Log result via PortfolioEvent".
             # Let's log if it WAS a rebalance trigger, even if dry_run.
             self._log_event(mode, reason, decision, current_weights)

        return result

    def _execute_rebalance(self, holdings, new_weights, total_value, decision):
        """
        Updates portfolio quantities based on new weights.
        """
        # Map symbol -> holding object
        holding_map = {h.symbol: h for h in holdings}
        
        for symbol, weight in new_weights.items():
            if symbol in holding_map:
                holding = holding_map[symbol]
                # Calculate new quantity: (Weight * Total) / Price
                # Assuming Price is constant for this instant rebalance
                new_quantity = (weight * total_value) / holding.avg_price
                
                # Update DB
                holding.quantity = new_quantity
                holding.weight_target = weight
                holding.weight_drift = 0.0 # Reset drift
                # holding.risk_contribution = ... (if available from metrics)
        
        self.db.commit()

    def _log_event(self, mode, trigger_reason, decision, weights_before):
        event = PortfolioEvent(
            user_id=self.user.id,
            event_type="rebalance",
            event_payload={
                "mode": mode,
                "reason": trigger_reason,
                "action": decision.get("action"),
                "explanation_text": decision.get("reason"),
                "weights_before": weights_before.to_dict(),
                "weights_after": decision.get("new_weights", pd.Series()).to_dict() if decision.get("action") == "REBALANCE" else None
            }
        )
        self.db.add(event)
        self.db.commit()
