import pandas as pd
import numpy as np
from datetime import datetime
import logging

class StressScenarioGenerator:
    def __init__(self, tickers: list[str], start_date: datetime, end_date: datetime):
        self.tickers = tickers
        self.start_date = start_date
        self.end_date = end_date
        self.dates = pd.date_range(start_date, end_date, freq='B') # Business Days

    def generate_crash(self, drop_pct=0.30, duration_days=20):
        """
        Simulates a market crash.
        """
        data = {}
        for t in self.tickers:
            # Random Walk with Drift
            # Crash Period: Negative Drift, High Vol
            # Normal Period: Small Positive Drift, Low Vol
            
            n = len(self.dates)
            crash_idx = int(n * 0.4) # Start crash at 40%
            recover_idx = crash_idx + duration_days
            
            rets = np.zeros(n)
            
            # Normal
            rets[:crash_idx] = np.random.normal(0.0005, 0.01, crash_idx)
            
            # Crash
            crash_daily_drop = -drop_pct / duration_days
            rets[crash_idx:recover_idx] = np.random.normal(crash_daily_drop, 0.03, duration_days)
            
            # Recover
            rets[recover_idx:] = np.random.normal(0.001, 0.015, n - recover_idx)
            
            price_series = (1 + rets).cumprod() * 100.0
            
            df = pd.DataFrame({
                'Open': price_series,
                'Close': price_series * (1 + np.random.normal(0, 0.005, n)),
                'High': price_series * 1.02,
                'Low': price_series * 0.98,
                'Volume': 100000
            }, index=self.dates)
            
            data[t] = df
            
        return data

    def generate_high_vol_sideways(self):
        """
        Simulates a high volatility sideways market.
        """
        data = {}
        for t in self.tickers:
            n = len(self.dates)
            # Mean Reverting?
            # Or just Random Walk with 0 drift and High Vol.
            rets = np.random.normal(0.0, 0.025, n) # 2.5% daily vol ~ 40% Ann
            price_series = (1 + rets).cumprod() * 100.0
            
            df = pd.DataFrame({
                'Open': price_series,
                'Close': price_series, # Simplified
                'High': price_series * 1.03,
                'Low': price_series * 0.97,
                'Volume': 100000
            }, index=self.dates)
            data[t] = df
            
        return data
