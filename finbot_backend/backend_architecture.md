# Finbot Backend Architecture

This document provides a comprehensive overview of the Finbot backend structure, detailing the purpose of each folder and file, along with explanations of the underlying logic and execution flow.

The backend is built as a **FastAPI** application and follows a well-structured service-oriented architecture, integrating quantitative finance engines, a multi-agent swarm system for financial planning, and robust portfolio rebalancing mechanisms.

---

## Root Directory (`finbot_backend/`)

- **`main.py`**: The top-level entry point script used for running the FastAPI server.
- **`Dockerfile` & `docker-compose.yml`**: Infrastructure and containerization configurations for deployment.
- **`requirements.txt`**: Specifies all Python dependencies (e.g., FastAPI, SQLAlchemy, Pandas, Scikit-learn).
- **`alembic/` & `alembic.ini`**: Alembic migration files for SQLAlchemy database version control.
- **`test_*.py` & `verify_*.py`**: Various unit tests and verification scripts for ensuring the quant models, database connections, and rebalancing logic are functioning correctly.
- **`run_full_backtest.py`**: A standalone script that runs end-to-end backtests over historical data to evaluate portfolio performance.
- **`finbot.db`**: The SQLite database file for local development.

---

## Application Directory (`finbot_backend/app/`)

This directory houses the core application code.

### 1. `main.py`
The core FastAPI application instantiation (`app = FastAPI(...)`). It sets up CORS middleware, includes the master API router, and defines the lifespan context (like initializing the DB on startup).

### 2. `api/`
Contains all the FastAPI route controllers, organized by domain. These files handle HTTP requests and map them to the corresponding services.
- **`v1/router.py`**: The master router that imports and aggregates all domain-specific routers.
- **`v1/auth.py`**: Endpoints for user login, signup, and token generation.
- **`v1/chat.py`**: Endpoints for handling user interactions with the AI bot.
- **`v1/portfolio.py`**: Endpoints for creating, fetching, and managing user portfolios.
- **`v1/quant.py`**: Exposes the quantitative engine (e.g., triggering a model training job or generating ML-based portfolio recommendations).
- **`v1/swarm.py`**: Endpoints to trigger the multi-agent swarm (financial planning pipeline).
- **`v1/market.py`**: Endpoints to fetch live/historical market data.
- **`v1/user.py`** & **`v1/alerts.py`**: User profile and notification management endpoints.

### 3. `core/`
Handles application-wide configuration and foundational dependencies.
- **`config.py`**: Loads environment variables and manages application settings using Pydantic's `BaseSettings`.
- **`security.py`**: Password hashing, JWT token generation, and authentication utilities.
- **`deps.py`**: FastAPI dependency injections (e.g., getting a database session `get_db()`, fetching the current authenticated user).

### 4. `db/`
Database connection and session management.
- **`base.py`**: The declarative base class for SQLAlchemy models.
- **`session.py`**: Sets up the database engine and the SQLAlchemy `sessionmaker`.
- **`start.py`**: Initialization logic to create tables if they do not exist (`Base.metadata.create_all`).

### 5. `models/`
SQLAlchemy ORM definitions representing database tables.
- **`user.py`, `chat.py`, `portfolio.py`, `alert.py`**: Defines entities and relationships for users, chat histories, investment portfolios, and alerts.
- **`market_data.py`**: Schema for caching historical prices.
- **`prediction.py`**: Stores the ML model's quantitative predictions.

### 6. `schemas/`
Pydantic models for data validation and serialization (request/response models).
- **`auth.py`, `portfolio.py`, `user.py`, `response.py`**: Ensures that data coming into the API is valid, and shapes the outgoing JSON responses.

### 7. `services/`
The business logic layer. It abstracts database interactions and acts as the bridge between API routes and specialized engines (Swarm, Quant, Rebalancer).
- **`auth_service.py`**: Handles login flows and credential validation.
- **`portfolio_service.py`**: Logic for managing portfolio allocations and tracking history.
- **`quant_service.py`**: Interacts with the `quant_engine` to execute ML inferences and save predictions to the DB.
- **`rebalancer_service.py`**: Wraps the rebalancing mathematical logic for API consumption.

---

### 8. `services/swarm/` (The Multi-Agent System)
A sequential orchestration pipeline of AI agents designed to act as a financial advisor.
- **`coordinator.py`**: The `run_swarm()` orchestrator. It manages the lifecycle of the agents, passing the output of one agent as the input to the next, and yielding real-time status events (`SwarmEvent`) back to the user.
- **`schemas.py`**: Pydantic models for agent communication (e.g., `ParsedGoal`, `SIPPlan`, `AssetAllocation`).
- **`agents/`**:
  - **`goal_interpreter.py`**: Takes raw user text (e.g., "I want to save for a house") and parses it into structured financial goals.
  - **`sip_calculator.py`**: Calculates the required Systematic Investment Plan (monthly contributions) to hit the goal based on expected returns.
  - **`asset_allocator.py`**: Determines the macro-allocation (e.g., 60% Equity, 40% Debt) based on the user's timeline and risk tolerance.
  - **`market_analyst.py`**: Selects specific stocks/ETFs to fulfill the recommended asset allocation.

### 9. `quant_engine/` (Machine Learning & Predictive Models)
The AI engine that ranks assets and predicts future returns.
- **`pipeline.py`**: The `QuantPipeline` class orchestrates the end-to-end ML flow: fetching data, computing features, handling imputation/scaling, PCA dimensionality reduction, training an XGBoost regressor, and finally utilizing MPT (Modern Portfolio Theory) to output optimal asset weights.
- **`features.py`**: Computes technical indicators (e.g., moving averages, RSI) and defines the regression targets (e.g., 20-day forward returns).
- **`models.py`**: Wrappers for Scikit-learn or XGBoost estimators.
- **`data_loader.py`**: Interfaces with external market APIs (like yfinance) to retrieve raw pricing data.

### 10. `rebalancer/` (Portfolio Optimization Engine)
Handles the mathematics of correcting portfolio drift and executing trades.
- **`core_rebalance.py`**: Contains the core logic for portfolio realignment.
  - `full_rebalance()`: Computes exact buy/sell trades to bring a portfolio precisely to its target weights.
  - `minimal_rebalance()`: Suggests trades *only* if asset drift exceeds a specified threshold (e.g., 5%).
  - `value_preserving_rebalance()`: Adjusts shares while ensuring total portfolio value remains static, minimizing rounding losses.
- **`rebalance/mpt_solver.py`**: The Modern Portfolio Theory solver. Uses `scipy.optimize` to maximize the Sharpe ratio by finding the optimal weights of a given basket of assets based on their historical covariances.
- **`rebalance/execution_logic.py`**: Simulates or prepares the execution of the computed buy/sell orders.

### 11. `backtest/`
Framework for simulating the trading strategies over historical data.
- **`engine.py`**: Steps through time, simulates market states, triggers rebalances, and updates portfolio values.
- **`accountant.py`**: Tracks profit/loss, slippage, and trading fees during the simulation.
- **`metrics.py`**: Calculates performance KPIs such as Max Drawdown, CAGR (Compound Annual Growth Rate), and Sharpe ratio from the backtest results.
- **`scenarios.py`**: Defines specific historical stress tests (e.g., the 2020 COVID crash) to evaluate portfolio resilience.

### 12. `integrations/`
- **`razorpay.py`**: Helper functions for interacting with the Razorpay API for potential subscription or payment processing.

---

## Execution Logic Summary

1. **User Request**: A user submits a financial query or trade request via the Next.js frontend to the **`api/`** layer.
2. **Business Logic via Services**: The API forwards the payload to **`services/`**.
3. **Multi-Agent Swarm (If Financial Planning)**: If the user asks for a plan, the request flows to **`services/swarm/coordinator.py`**. It sequentially invokes the interpreter, calculator, allocator, and analyst agents, streaming back progress.
4. **Quant & MPT Optimization (If Investing/Rebalancing)**: 
   - The **`quant_engine/pipeline.py`** fetches market data, engineers features, and runs ML models to predict asset returns.
   - The predicted best-performing assets are passed to the **`rebalancer/rebalance/mpt_solver.py`**, which mathematically finds the most efficient allocation (Max Sharpe Ratio).
5. **Trade Execution**: The **`rebalancer/core_rebalance.py`** calculates the discrete number of shares to BUY or SELL to achieve the target weights.
6. **Data Persistence**: All history, chat logs, portfolios, and predictions are validated via **`schemas/`** and persisted to the SQLite/PostgreSQL database via SQLAlchemy **`models/`**.
