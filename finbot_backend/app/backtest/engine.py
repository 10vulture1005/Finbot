import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from app.backtest.accountant import PortfolioAccountant
from app.quant_engine.data_loader import QuantitativeDataClient
from app.quant_engine.pipeline import QuantPipeline
from app.rebalancer.rebalance.execution_logic import ExecutionLogic, RebalanceConfig
from app.models.market_data import MarketData
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class BacktestEngine:
    def __init__(self, db: Session, tickers: list[str], start_date: datetime, end_date: datetime, capital: float = 100000.0):
        self.db = db
        self.tickers = tickers
        self.start_date = start_date
        self.end_date = end_date
        self.accountant = PortfolioAccountant(initial_capital=capital)
        self.data_client = QuantitativeDataClient()
        self.pipeline = QuantPipeline()
        self.pending_orders = [] # List of (symbol, quantity) for Next Open
        
        # Config (Standard Institutional)
        self.config = RebalanceConfig(
            drift_threshold=0.05,
            vol_target=0.15,
            vol_tolerance=0.05,
            max_turnover=0.20,
            rebalance_frequency_months=1
        )
        self.logic = ExecutionLogic(self.config)
        
        self.current_date = start_date
        self.last_rebalance = start_date - timedelta(days=40)

    def run(self):
        """
        Main Simulation Loop.
        """
        logger.info(f"Starting Backtest from {self.start_date.date()} to {self.end_date.date()}...")
        
        day_delta = timedelta(days=1)
        while self.current_date <= self.end_date:
            # Skip Weekends
            if self.current_date.weekday() >= 5: # Sat/Sun
                self.current_date += day_delta
                continue
                
            self._process_day()
            self.current_date += day_delta
            
        logger.info("Backtest Complete.")
        return self.accountant.equity_curve

    def _process_day(self):
        current_dt = self.current_date
        
        # 1. Get Today's Prices (Open, Close, High, Low)
        daily_data = self._fetch_daily_data(current_dt)
        if not daily_data:
             return # Market Closed or No Data

        # 2. Extract Open/Close Prices
        open_prices = {t: data['Open'] for t, data in daily_data.items()}
        close_prices = {t: data['Close'] for t, data in daily_data.items()}
        
        # 3. Execute Pending Orders (at Open)
        if self.pending_orders:
            logger.info(f"Executing {len(self.pending_orders)} orders at Open on {current_dt.date()}")
            executed_count = 0
            remaining_orders = []
            
            for symbol, quantity, reason in self.pending_orders:
                price = open_prices.get(symbol)
                if price:
                    # Estimate Slippage based on Volatility?
                    # Using fixed 10bps for now + Commission
                    self.accountant.execute_trade(
                        date=current_dt,
                        symbol=symbol,
                        quantity=quantity,
                        price=price,
                        commission_rate=0.001,
                        slippage_factor=0.0005 # 5bps slippage at Open
                    )
                    executed_count += 1
                else:
                    logger.warning(f"Could not execute order for {symbol}: No Price")
                    remaining_orders.append((symbol, quantity, reason))
            
            self.pending_orders = remaining_orders

        # 4. Update Accountant NAV (Mark-to-Market at Close)
        self.accountant.record_snapshot(current_dt, close_prices)
        
        # 5. Check Rebalance Trigger (Monthly)
        days_since = (current_dt - self.last_rebalance).days
        if days_since >= 30:
            self._run_rebalance_event(current_dt, daily_data, close_prices)

    def _fetch_daily_data(self, date: datetime) -> dict:
        """
        Fetch OHLCV for specific date from DB.
        """
        rows = self.db.query(MarketData).filter(
            MarketData.date == date,
            MarketData.ticker.in_(self.tickers)
        ).all()
        
        if not rows:
            return {}
            
        return {r.ticker: {'Open': r.open, 'Close': r.close, 'High': r.high, 'Low': r.low, 'Volume': r.volume} for r in rows}

    def _run_rebalance_event(self, date, daily_data, current_prices):
        logger.info(f"Rebalance Algorithm Triggered at {date.date()}")
        
        # A. Pipeline Update (Train Model)
        # Train on data UP TO yesterday? Or Today?
        # If we rebalance at Close (decision) and execute next Open, we know Today's Close.
        # So we can train on data including TODAY.
        self.pipeline.run_training(self.db, self.tickers, training_date=date)
        
        # B. Generate Decision
        holdings_summary = self.accountant.get_holdings_summary()
        current_nav = self.accountant.get_total_value(current_prices)
        
        # Convert holdings to weights (Current Portfolio State)
        current_weights_dict = {}
        for t in self.tickers:
            qty = holdings_summary.get(t, 0.0)
            val = qty * current_prices.get(t, 0.0)
            current_weights_dict[t] = val / current_nav if current_nav > 0 else 0.0

        current_weights = pd.Series(current_weights_dict)

        # C. Fetch Returns Window (Lookback for MPT)
        # Fetch 2y history ending TODAY
        market_data = self.data_client.fetch_market_data(self.db, self.tickers, period="2y", end_date=date)
        
        combined_df = pd.DataFrame()
        for t, df in market_data.items():
            if not df.empty and 'Close' in df.columns:
                combined_df[t] = df['Close']
        
        if combined_df.empty:
            logger.warning("No market data for rebalance!")
            return

        returns_window = combined_df.pct_change().dropna()

        # D. Get Holdings Data (Tax)
        # (Need to extract from Accountant in format expected by Logic)
        holdings_data = [] # TODO: Extract detailed lots from accountant if needed for Tax optimization
        # For simulation, accountant tracks tax internally on execution, but logic needs data to OPTIMIZE decision.
        # Simplification: Pass empty list, logic will skip tax optimization layer but accountant still charges tax.
        # This is acceptable for Phase 7 MVP.

        decision = self.logic.generate_rebalance_decision(
            date, 
            self.last_rebalance, 
            current_weights, 
            returns_window, 
            holdings_data
        )

        if decision.get('action') == 'REBALANCE':
            target_weights = decision.get('new_weights', {})
            reason = decision.get('reason', 'Rebalance')
            self._generate_orders(target_weights, current_prices, current_nav, reason)
            self.last_rebalance = date

    def _generate_orders(self, target_weights, current_prices, current_nav, reason):
        """
        Generates orders to move from Current -> Target.
        Queues them for next Open.
        """
        for symbol, weight in target_weights.items():
            price = current_prices.get(symbol, 0.0)
            if price <= 0:
                continue
                
            target_value = weight * current_nav
            
            # Current Quantity
            current_lots = self.accountant.holdings.get(symbol, [])
            current_qty = sum(h.quantity for h in current_lots)
            current_val = current_qty * price
            
            diff_val = target_value - current_val
            
            # If Diff is small (dust), skip? Logic already handles dust.
            # Convert Value Difference to Quantity
            quantity = diff_val / price
            
            # Queue Order
            # Rounding?
            if abs(quantity) > 0.0001: # Min quantity check
                self.pending_orders.append((symbol, quantity, reason))
