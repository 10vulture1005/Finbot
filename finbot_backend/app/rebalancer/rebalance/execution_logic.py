from dataclasses import dataclass
import pandas as pd
import json
import os

from app.rebalancer.rebalance.mpt_solver import MPTSolver

@dataclass
class RebalanceConfig:
    drift_threshold: float
    vol_target: float
    vol_tolerance: float
    max_turnover: float
    rebalance_frequency_months: int

from enum import Enum

class MarketRegime(Enum):
    BULL = "BULL"
    BEAR = "BEAR"
    HIGH_VOL = "HIGH_VOL"
    NEUTRAL = "NEUTRAL"

class ExecutionLogic:
    def __init__(self, config: RebalanceConfig):
        self.config = config
        # self.openai_client initialized dynamically now

    def generate_rebalance_decision(self, current_date, last_rebalance_date, current_weights, returns_window, holdings_data=None):
        """
        Generates a rebalance decision using Multi-Layered Logic.
        Layers: Drift -> Confidence -> Turnover -> Tax -> Stability.
        """
        # 0. Check data sufficiency
        if returns_window.empty or len(returns_window) < 30:
             return self._hold_decision("Insufficient data", current_weights)

        # --- Layer 1: Regime & Drift ---
        regime, market_metrics = self._detect_market_regime(returns_window)
        market_vol = market_metrics['volatility']
        
        # Dynamic Threshold
        base_threshold = self.config.drift_threshold
        # Institutional approach: Widen in high vol to reduce noise cost.
        # If Regime is HIGH_VOL, widen significantly.
        # If BULL, standard.
        # If BEAR, maybe tighten to ensure we move to defensive fast? Or standard.
        
        vol_factor = 1.0
        if regime == MarketRegime.HIGH_VOL:
            vol_factor = max(1.5, market_vol / 0.20) # At least 1.5x wider
        elif regime == MarketRegime.BEAR:
            vol_factor = 1.0 # Standard sensitivity to exit
        
        dynamic_threshold = base_threshold * vol_factor

        # Run Optimizer to get Ideal Target
        solver = MPTSolver(returns_window)
        
        # Calculate dynamic max weight based on number of assets
        num_assets = len(current_weights)
        # If < 4 assets, 30% max weight is mathematically impossible since they couldn't sum to 100%.
        # E.g. 2 assets: Max weight should be at least 50%, realistically 70-80% to allow optimization.
        dynamic_max_weight = max(0.30, 1.0 / num_assets + 0.10) if num_assets > 0 else 0.30

        # Regime-based Strategy Selection
        # Defensive if Bear or High Vol
        if regime in [MarketRegime.BEAR, MarketRegime.HIGH_VOL] or self.config.vol_target < 0.12:
            optimization_result = solver.minimize_volatility(max_weight=dynamic_max_weight)
            strategy_name = f"Minimum Volatility ({regime.value})"
        else:
            optimization_result = solver.maximize_sharpe_ratio(max_weight=dynamic_max_weight)
            strategy_name = f"Maximum Sharpe Ratio ({regime.value})"
            
        if not optimization_result["success"]:
             return self._hold_decision(f"Optimization failed: {optimization_result['message']}", current_weights)

        ideal_weights = optimization_result["weights"]
        metrics = optimization_result["metrics"]

        # --- Layer 2: Confidence Filter (Shrinkage) ---
        # Assuming we have confidence scores in future. For now, we simulate shrinkage towards current weights.
        # If we had ML confidence, we would do: target = current + confidence * (ideal - current)
        # Here we use a static shrinkage for stability if market is crazy.
        # For Phase 6, we implement this as a placeholder or use Volatility as confidence proxy.
        # If Vol is extreme, confidence in "Sharpe" is low.
        confidence_score = 1.0 if market_vol < 0.20 else 0.8
        
        target_weights = {}
        all_symbols = set(ideal_weights.keys()) | set(current_weights.keys())
        for sym in all_symbols:
            w_ideal = ideal_weights.get(sym, 0.0)
            w_curr = current_weights.get(sym, 0.0)
            # Apply Confidence Shrinkage
            target_weights[sym] = w_curr + confidence_score * (w_ideal - w_curr)

        # --- Layer 3: Turnover Constraint (Utility vs Cost) ---
        turnover = 0.0
        max_drift = 0.0
        for sym, w_tgt in target_weights.items():
            w_curr = current_weights.get(sym, 0.0)
            diff = abs(w_tgt - w_curr)
            turnover += diff
            if diff > max_drift:
                max_drift = diff
        turnover /= 2.0
        
        # Filter 3.1: Drift Check
        if max_drift < dynamic_threshold:
             return self._hold_decision(f"Drift ({max_drift:.1%}) < Threshold ({dynamic_threshold:.1%})", current_weights, metrics, strategy_name)

        # Filter 3.2: Cost Benefit (Approximation)
        curr_ret, curr_vol = solver.portfolio_performance(current_weights.reindex(solver.tickers).fillna(0).values)
        curr_sharpe = (curr_ret - solver.risk_free_rate) / curr_vol if curr_vol > 1e-6 else 0
        sharpe_gain = metrics['sharpe_ratio'] - curr_sharpe
        
        # Dynamic Cost Estimation
        # Base Cost (Brokerage + Tax) ~ 20bps
        # Slippage ~ Function of Volatility. E.g. 10% of Daily Vol.
        # Daily Vol = market_vol / sqrt(252).
        # estimated_slippage = (market_vol / 16.0) * 0.005 # Heuristic: if vol is 16%, slippage is 5bps.
        estimated_cost_pct = 0.0020 + (market_vol / 16.0) * 0.0010
        total_cost = turnover * estimated_cost_pct
        
        # Net Benefit Analysis
        # We need to compare Sharpe Gain (risk-adjusted return) with One-Time Cost (?)
        # This is tricky. Sharpe is a rate. Cost is a level.
        # Simple heuristic: If Sharpe improvement * Volatility (approx Return improvement) < Cost, then skip.
        # Return Diff ~ Sharpe Diff * Vol.
        expected_return_gain = sharpe_gain * metrics['expected_volatility']
        
        # If expected 1-year return gain < cost of trading, HOLD.
        if expected_return_gain < total_cost:
             return self._hold_decision(f"Efficiency: Return Gain {expected_return_gain:.2%} < Cost {total_cost:.2%}", current_weights, metrics, strategy_name)

        # --- Layer 4: Tax-Aware Filter (India STCG Protection) ---
        # If selling a winner held < 12 months, reduce sell amount if marginal benefit is low.
        # We need holdings_data (list of dicts with 'purchase_date', 'avg_price', 'current_price' approx)
        # Since we only receive aggregated holdings, we check 'purchase_date' of the position.
        
        final_weights = target_weights.copy()
        
        if holdings_data:
            for holding in holdings_data:
                sym = holding['symbol']
                qty = holding['quantity']
                # Skip if not selling
                if final_weights.get(sym, 0) >= current_weights.get(sym, 0):
                    continue
                    
                # We are SELLING. Check Tax.
                # Approx Gain
                # We need current price. We can infer from current_weight and total_value? 
                # Or just assume if avg_price < current_price (we don't have current price here explicitly).
                # We rely on RebalancerService to pass price/gain info.
                # Check Holding Period
                if holding.get('days_held', 365) < 365:
                    # Short Term. Check if Gain > 0.
                    # We assume selling winners here (simplification).
                    # Rule: Cap sell amount to 50% of intended sell to defer tax.
                    # We apply this regardless of confidence for safety in this phase.
                    w_curr = current_weights.get(sym, 0.0)
                    w_tgt = final_weights[sym]
                    # Reduce the sell by half
                    final_weights[sym] = w_curr + 0.5 * (w_tgt - w_curr)
        
        # --- Layer 5: Stability Smoothing (EMA) ---
        # Prevent "flicker".
        # New = Old * 0.3 + Target * 0.7
        smoothed_weights = {}
        lambda_factor = 0.7 
        
        for sym in all_symbols:
            w_tgt = final_weights.get(sym, 0.0)
            w_curr = current_weights.get(sym, 0.0)
            
            # If change is tiny, stick to current (Sticky)
            if abs(w_tgt - w_curr) < 0.01:
                smoothed_weights[sym] = w_curr
            else:
                smoothed_weights[sym] = w_curr * (1 - lambda_factor) + w_tgt * lambda_factor

        # --- Layer 6: Risk Guardrails (Turnover Cap & Dust Cleanup) ---
        
        # 6.1 Dust Cleanup (Min Weight 2%)
        min_weight_threshold = 0.02
        for sym in list(smoothed_weights.keys()):
            if smoothed_weights[sym] < min_weight_threshold:
                smoothed_weights[sym] = 0.0
        
        # Normalize after dust cleanup
        total_w = sum(smoothed_weights.values())
        if total_w > 0:
            smoothed_weights = {k: v/total_w for k, v in smoothed_weights.items()}

        # 6.2 Turnover Check & Capping
        # Calculate proposed turnover
        proposed_turnover = 0.0
        for sym in all_symbols:
             proposed_turnover += abs(smoothed_weights.get(sym, 0) - current_weights.get(sym, 0))
        proposed_turnover /= 2.0
        
        # If turnover > Max Turnover (e.g. 20%), Scale it down.
        # Target = Current + (Proposed - Current) * (MaxTurnover / ProposedTurnover)
        max_turnover_allowed = self.config.max_turnover
        if proposed_turnover > max_turnover_allowed:
            scale_factor = max_turnover_allowed / proposed_turnover
            scaled_weights = {}
            for sym in all_symbols:
                w_curr = current_weights.get(sym, 0.0)
                w_prop = smoothed_weights.get(sym, 0.0)
                scaled_weights[sym] = w_curr + (w_prop - w_curr) * scale_factor
            smoothed_weights = scaled_weights
            
            # Re-normalize
            total_w = sum(smoothed_weights.values())
            if total_w > 0:
                smoothed_weights = {k: v/total_w for k, v in smoothed_weights.items()}

        # Explanation
        explanation = self.generate_ai_explanation(
            current_weights.to_dict(), 
            smoothed_weights, 
            metrics, 
            strategy_name
        )

        return {
            "action": "REBALANCE",
            "new_weights": smoothed_weights,
            "reason": explanation,
            "metrics": metrics,
            "strategy": strategy_name
        }

    def _hold_decision(self, reason, weights, metrics=None, strategy="HOLD"):
        return {
            "action": "HOLD",
            "reason": reason,
            "new_weights": weights.to_dict(),
            "metrics": metrics or {},
            "strategy": strategy
        }

    def generate_ai_explanation(self, current_weights, new_weights, metrics, strategy):
        """
        Uses Groq (llama-3.3-70b-versatile) to generate a natural language
        explanation of the rebalance decision.
        """
        try:
            from groq import Groq

            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                return f"Rebalanced based on '{strategy}'. (API Key missing for explanation)"

            client = Groq(api_key=api_key)

            # Prepare context for LLM
            prompt = f"""
            You are a portfolio manager. Explain the following rebalancing decision to a user in simple, professional terms.
            
            Strategy: {strategy}
            Current Portfolio Weights: {json.dumps(current_weights)}
            Proposed Portfolio Weights: {json.dumps(new_weights)}
            Projected Metrics:
            - Expected Return: {metrics.get('expected_return', 0):.2%}
            - Expected Volatility: {metrics.get('expected_volatility', 0):.2%}
            - Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.2f}
            
            Key changes (increases/decreases):
            {self._get_weight_diffs(current_weights, new_weights)}
            
            Explain WHY this change optimizes the portfolio according to the {strategy} strategy. Keep it under 3 sentences.
            """

            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a concise, professional portfolio manager."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=256,
            )
            return completion.choices[0].message.content.strip()

        except Exception as e:
            print(f"AI Generation Failed: {e}")
            return f"The portfolio was rebalanced to align with the {strategy} strategy, optimizing for risk-adjusted returns."

    def _detect_market_regime(self, returns):
        """
        Detects Market Regime based on Volatility and Trend.
        """
        # 1. Volatility (Annualized Std of equal-weight index)
        # Proxy: Mean of asset volatilities is safer if correlations break
        asset_vols = returns.std() * (252**0.5)
        market_vol = asset_vols.mean()
        
        # 2. Trend (Price vs SMA)
        # Construct an equal-weight index
        market_index = (1 + returns.mean(axis=1)).cumprod()
        
        # Calculate Drawdown from Peak
        peak = market_index.cummax()
        drawdown = (market_index - peak) / peak
        max_dd = drawdown.min()
        current_dd = drawdown.iloc[-1]
        
        # Simple Regime Classification
        # High Volatility Threshold: 20%
        if market_vol > 0.20:
            regime = MarketRegime.HIGH_VOL
        # Bear Market: Drawdown > 20% or if recent trend is strongly negative
        elif current_dd < -0.20:
            regime = MarketRegime.BEAR
        # Bull Market: Positive Trend (Price > SMA50 not calc here, but assuming !Bear and !HighVol = Bull/Neutral)
        # We can refine this.
        else:
            regime = MarketRegime.BULL
            
        return regime, {"volatility": market_vol, "drawdown": current_dd}

    def _get_weight_diffs(self, current, new):
        diffs = []
        all_keys = set(current.keys()) | set(new.keys())
        for k in all_keys:
            c = current.get(k, 0)
            n = new.get(k, 0)
            diff = n - c
            if abs(diff) > 0.01:
                diffs.append(f"{k}: {'+' if diff > 0 else ''}{diff:.1%}")
        return ", ".join(diffs)
