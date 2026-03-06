import pandas as pd
import numpy as np
from datetime import datetime

class BacktestMetrics:
    def __init__(self, equity_curve: list[dict]):
        self.equity_curve = pd.DataFrame(equity_curve)
        if not self.equity_curve.empty:
            self.equity_curve['date'] = pd.to_datetime(self.equity_curve['date'])
            self.equity_curve.set_index('date', inplace=True)
            self.equity_curve['daily_ret'] = self.equity_curve['nav'].pct_change().fillna(0.0)

    def calculate_all(self):
        if self.equity_curve.empty:
            return {}
            
        nav = self.equity_curve['nav']
        rets = self.equity_curve['daily_ret']
        
        # 1. CAGR
        days = (nav.index[-1] - nav.index[0]).days
        years = days / 365.25
        total_ret = (nav.iloc[-1] / nav.iloc[0]) - 1
        cagr = (1 + total_ret) ** (1 / years) - 1 if years > 0 else 0.0
        
        # 2. Volatility (Annualized)
        daily_vol = rets.std()
        ann_vol = daily_vol * np.sqrt(252)
        
        # 3. Sharpe Ratio (Rf=0 for simplicity, or 5%)
        rf = 0.05
        excess_ret = cagr - rf
        sharpe = excess_ret / ann_vol if ann_vol > 0 else 0.0
        
        # 4. Max Drawdown
        roll_max = nav.cummax()
        drawdown = (nav - roll_max) / roll_max
        max_dd = drawdown.min()
        
        # 5. Sortino Ratio (Downside deviation)
        neg_rets = rets[rets < 0]
        downside_std = neg_rets.std() * np.sqrt(252)
        sortino = excess_ret / downside_std if downside_std > 0 else 0.0
        
        # 6. Calmar Ratio
        calmar = cagr / abs(max_dd) if max_dd != 0 else 0.0
        
        return {
            "Total Return": f"{total_ret*100:.2f}%",
            "CAGR": f"{cagr*100:.2f}%",
            "Volatility": f"{ann_vol*100:.2f}%",
            "Sharpe Ratio": f"{sharpe:.2f}",
            "Sortino Ratio": f"{sortino:.2f}",
            "Calmar Ratio": f"{calmar:.2f}",
            "Max Drawdown": f"{max_dd*100:.2f}%",
            "Duration (Years)": f"{years:.2f}"
        }

    def generate_report(self):
        stats = self.calculate_all()
        report = "\n--- Backtest Performance Report ---\n"
        for k, v in stats.items():
            report += f"{k:<20}: {v}\n"
        return report
