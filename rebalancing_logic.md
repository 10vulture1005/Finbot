# Finbot Rebalancing Logic Explanation

The Finbot application implements two distinct methods for rebalancing a user's stock portfolio: **Standard Drift Rebalancing** and **AI-Driven Optimization (Quant Engine)**. Both approaches ultimately rely on Modern Portfolio Theory (MPT) to calculate the optimal allocation, but they differ in how they select the assets and when they trigger.

---

## 1. Standard Drift Rebalancing
*Files involved: `app/services/rebalancer_service.py`, `app/rebalancer/rebalance/execution_logic.py`, `app/rebalancer/mpt/mpt_solver.py`*

This is the traditional automated rebalancing feature designed to keep the portfolio aligned with the user's risk tolerance.

### How it works:
1. **Drift Detection:** 
   The system calculates the user's current portfolio weights based on the latest market prices. It compares these current weights against the target weights (or checks if the portfolio's overall volatility has drifted beyond the user's `rebalance_threshold`, typically 15%).
2. **Execution Logic:**
   If a significant drift is detected, the `ExecutionLogic` engine is triggered.
3. **Historical Data:**
   It fetches the last 2 years of daily closing prices for all the stocks currently held in the portfolio.
4. **MPT Optimization:**
   The historical returns are fed into the `MPTSolver`. The solver uses numerical optimization (via `scipy.optimize`) to find the exact percentage weight for each stock that **Maximizes the Sharpe Ratio** (giving the best expected return for the lowest possible risk).
5. **Trade Generation:**
   The backend calculates the differences between the current weights and the newly optimized MPT weights, generating the necessary BUY and SELL actions to reach the target allocation.

---

## 2. AI-Driven Optimization (Quant Engine)
*Files involved: `app/services/quant_service.py`, `app/quant_engine/pipeline.py`, `app/quant_engine/models.py`*

This is the "AI Optimize" feature on the dashboard. Instead of just re-weighting existing assets, it actively predicts which of the user's holdings will perform best and drops the underperformers.

### How it works:
1. **Feature Engineering:**
   The pipeline downloads recent market data for the user's current holdings and calculates various technical indicators (Moving Averages, RSI, MACD, Bollinger Bands, Volatility, etc.).
2. **Machine Learning Prediction:**
   An `XGBoost` regression model (trained to predict 6-month forward returns) evaluates the technical features of each stock. It outputs a "Probability" score indicating how likely each stock is to be a "Winner".
3. **Asset Selection:**
   The AI filters the portfolio, keeping only the top candidates that have a high conviction score (probability > 0.5). Stocks that fall below this threshold are marked to be completely sold off (Target Weight = 0%).
4. **MPT Optimization:**
   The selected "Winner" stocks are then passed to the `MPTSolver`. Just like the standard rebalancer, the solver calculates the optimal weights among this reduced subset of high-performing stocks to maximize the Sharpe Ratio.
5. **Result Merging:**
   The final generated JSON payload explicitly includes the `0.0` target weights for the dropped stocks so that the frontend can accurately render them as **SELL** orders.

---

## Summary of Differences

| Feature | Trigger | Asset Selection | Weight Allocation Algorithm |
| :--- | :--- | :--- | :--- |
| **Check Balance** | Drift threshold exceeded | Keeps all current holdings | MPT Solver (Max Sharpe) |
| **AI Optimize** | Manual user click | Drops predicted underperformers using XGBoost | MPT Solver on remaining Winners |
