# Finbot: Complete Interview Learning Flow & Study Guide

This guide breaks down the Finbot project into a logical, step-by-step learning path. Follow this sequence to understand the system end-to-end for your interview.

---

## 🟢 Step 1: High-Level Architecture & Tech Stack
**Goal:** Understand what the application is, how it's structured, and what technologies power it.

*   **The Product:** An AI-powered Indian equity portfolio manager that combines traditional portfolio management, machine learning-driven quantitative analysis, mathematical portfolio optimization (MPT), and GenAI chat.
*   **Backend (Python):** FastAPI (REST framework), SQLAlchemy (ORM for DB), Alembic (Migrations). Uses SQLite for dev, PostgreSQL for production (via Docker).
*   **Frontend (TypeScript):** Next.js 16 (App Router), React 19, Tailwind CSS v4.
*   **External Integrations:** yfinance (market data), Razorpay (payments/gating), Thesys SDK / Claude (Chat AI), Google Gemini (Risk Analysis).

**Interview Prep:** Be ready to draw the architecture. Request hits FastAPI -> Auth checked -> DB queried via SQLAlchemy -> External APIs called if needed -> Response returned to Next.js.

---

## 🟢 Step 2: Database Models & Core Entities
**Goal:** Understand the data layer and relationships.
*   **Location:** `finbot_backend/app/models/`
*   **`User`:** Stores auth details (`hashed_password`, `email`), rebalancing configuration (`target_volatility`, `rebalance_frequency`), and a JSON column (`risk_analysis`) for caching Gemini output.
*   **`PortfolioStock`:** Represents holding. FK to `User`. Stores `symbol`, `quantity`, `avg_price`.
    *   *Important Note:* Highly dynamic fields like `current_price`, `market_value`, `daily_return`, and `sector` are **NOT** stored in the database. They are computed dynamically on the fly to ensure real-time accuracy.
*   **`PortfolioEvent`:** An audit log that tracks when and why the portfolio was rebalanced.

---

## 🟢 Step 3: Authentication & Payment Gate
**Goal:** Understand how the stateless JWT flow works and how signups are gated.
*   **Location:** `finbot_backend/app/api/v1/auth.py` and `finbot_backend/app/core/security.py`
*   **The Flow:**
    1.  User posts to `/signup-init` (creates inactive user in DB, hashes password using `bcrypt`).
    2.  Frontend processes payment via Razorpay.
    3.  Frontend calls `/signup-verify` with Razorpay signature. Backend validates using HMAC-SHA256 (`verify_payment_signature`).
    4.  If valid, user is activated and receives an Access Token and Refresh Token (JWTs).
*   **JWT Security:** Tokens contain `sub` (user_id) and `exp` (expiry). The server doesn't store session state; it just verifies the JWT signature (`get_current_user` dependency).

---

## 🟡 Step 4: Portfolio Service (The Core Engine Data Provider)
**Goal:** Understand how the app gets live data.
*   **Location:** `finbot_backend/app/services/portfolio_service.py`
*   **Data Enrichment:** When `get_portfolio` is called, it fetches user's `PortfolioStock` rows from the DB, then makes a batch call to `yfinance` to get the latest close prices.
*   **Sector Caching:** To avoid rate limits, known large-cap Indian stocks (e.g., RELIANCE, TCS) have their sectors hardcoded in a dict. If missing, it falls back to the `indianapi.in/industry_search` API.
*   **Analytics Calculation:** Calculates overall growth, sector distribution, and historical risk metrics (annualized volatility, max drawdown, Sharpe ratio). If no DB history exists, it falls back to a 30-day simulated walk or yfinance historical prices.

---

## 🟡 Step 5: Quant Engine & Machine Learning
**Goal:** Understand the predictive stock analysis engine.
*   **Location:** `finbot_backend/app/quant_engine/`
*   **Features Engine (`features.py`):** Calculates technical indicators from price/volume data. Key features: EMA (50/200), RSI, MACD, Bollinger Bands, Volatility (annualized), Momentum, and Volume Surge.
*   **Target Variable:** Forward 20-day return (`Price[t+20]/Price[t] - 1`). The model is a regression model trying to predict the 20-day lookahead return.
*   **Pipeline (`pipeline.py`):** Data Imputation (KNN) -> Scaling (MinMaxScaler) -> Dimensionality Reduction (PCA keeping 95% variance) -> Model (`XGBRegressor`).
*   **Validation:** Uses "Walk-Forward Validation" (rolling 2-year train, 6-month test window) to prevent look-ahead bias and simulate real-world trading conditions.

---

## 🟠 Step 6: Portfolio Rebalancing (Modern Portfolio Theory)
**Goal:** Explain how the app optimizes weights mathematically.
*   **Location:** `finbot_backend/app/rebalancer/`
*   **The Math (`risk_mpt.py`):** Implements Modern Portfolio Theory (MPT). Uses `scipy.optimize.minimize` (SLSQP engine).
*   **Objective:** Minimizes portfolio variance (`wᵀ Σ w`) subject to constraints (weights sum to 1, no shorting/weights >= 0).
*   **Execution Flow:**
    1.  `QuantService.run_analysis` identifies target stocks (via ML predictions).
    2.  Pulls 1-year historical returns.
    3.  MPT Solver calculates the "optimal" weight for each stock to minimize volatility.
    4.  `RebalancerService.run_rebalance` checks if current weights drift beyond user thresholds.
    5.  Logs a `PortfolioEvent` after executing buys/sells to reach target weights.

---

## 🟠 Step 7: AI Integrations (Claude & Gemini)
**Goal:** Understand Gen AI use cases.
*   **Chat AI (`finbot_backend/app/api/v1/chat.py`):**
    *   Uses **Thesys GenUI SDK** targeting an OpenAI-compatible endpoint using `claude-sonnet-4`.
    *   **Context Strategy:** On every chat request, the backend fetches the user's *live* portfolio and builds a massive system prompt containing a markdown table of their holdings, P&L, and sector distributions. The AI uses this to give highly localized financial advice.
*   **Risk Analysis (`finbot_backend/app/api/v1/quant.py`):**
    *   Uses **Google Gemini** (`google-generativeai`).
    *   Summarizes the portfolio and asks Gemini to generate a risk narrative (Low/Medium/High, concentration risks, recommendations).
    *   Output is cached in the `User.risk_analysis` JSON column to save costs.

---

## 🔴 Step 8: Frontend Implementation Details
**Goal:** Talk comfortably about the UI layer.
*   **Location:** `finbot-frontend/`
*   **Routing:** Next.js App Router. Distinct folders for `/land` (marketing) and `/userspace` (authenticated app).
*   **Data Vis:** Uses `recharts` for portfolio growth graphs and allocation pie charts.
*   **Animations:** Heavy use of `framer-motion` for component-level interaction and `gsap` for landing page scroll magic.
*   **State / UI:** Uses `@thesysai/genui-sdk` for the chat interface and standard React hooks to hit the FastAPI backend. Styling entirely via Tailwind CSS v4.

---

## 💡 Quick Tips for the Interview
*   **"Why PCA in ML?"** Mention that indicators like EMA50 and EMA200 are highly correlated. PCA removes multicollinearity and reduces noise.
*   **"How do you handle real-time data?"** Explain that the DB only stores quantities and buy prices. Current prices are pulled *just in time* from yfinance during the API request so users never see stale data.
*   **"Explain your Auth without sessions."** Explain JWTs. The token is cryptographically signed; the backend validates it using `JWT_SECRET` but doesn't need to look up a session table in the DB.

Good luck! Use this guide to structure your answers logically, moving from the Database up to the user interface.
