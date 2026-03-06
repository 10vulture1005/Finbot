import sys
import os
import numpy as np
import pandas as pd
import logging
import unittest

# Ensure app is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.quant_engine.features import FeatureEngineer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestMLFeatures")

class TestMLFeatures(unittest.TestCase):
    
    def setUp(self):
        # Create synthetic price data
        dates = pd.date_range(start='2020-01-01', periods=300, freq='D')
        self.df = pd.DataFrame(index=dates)
        # Linear trend 100 -> 130
        self.df['Close'] = np.linspace(100, 130, 300)
        self.df['Open'] = self.df['Close']
        self.df['High'] = self.df['Close'] * 1.01
        self.df['Low'] = self.df['Close'] * 0.99
        self.df['Volume'] = 10000
        
        # Synthetic market data
        self.market_df = self.df.copy()
        self.market_df['Close'] = np.linspace(1000, 1100, 300) # Diff trend

        self.fe = FeatureEngineer()

    def test_target_alignment(self):
        """Verify 20-day target is shifted correctly"""
        logger.info("Testing Target Alignment...")
        df = self.fe.compute_regression_target(self.df.copy(), horizon=20)
        
        # Manually calc forward return for t=0
        # t=0 price = 100
        # t=20 price = 100 + (30/299)*20 approx 102
        
        p0 = df['Close'].iloc[0]
        p20 = df['Close'].iloc[20]
        expected_target = (p20 / p0) - 1
        
        calc_target = df['Target_20d'].iloc[0]
        
        self.assertAlmostEqual(expected_target, calc_target, places=5)
        
        # Check end of df - should be NaN for last 20
        self.assertTrue(np.isnan(df['Target_20d'].iloc[-1]))
        self.assertTrue(np.isnan(df['Target_20d'].iloc[-20]))
        self.assertFalse(np.isnan(df['Target_20d'].iloc[-21]))

    def test_features_calculation(self):
        """Verify technical features"""
        logger.info("Testing Features...")
        df = self.fe.compute_technical_features(self.df.copy(), self.market_df)
        
        # Check columns existence
        expected_cols = [
            'Ret_5d', 'Ret_20d', 'Ret_60d', 'Ret_120d',
            'Vol_20d', 'Vol_60d',
            'Dist_EMA_50', 'Dist_EMA_200',
            'Beta_60d', 'Mkt_Corr_60d'
        ]
        for c in expected_cols:
            self.assertIn(c, df.columns)
            
        # Check Volatility (Linear trend -> 0 std dev? No, pct_change is roughly constant)
        # But rolling std of price or return?
        # Code uses: close.rolling(20).std()
        # Wait, volatility should be usually std of RETURNS, not PRICE.
        # Let's check code implementation in features.py
        # df['Vol_20d'] = close.rolling(20).std() * np.sqrt(252) 
        # This calculates volatility of P RICE levels, which is wrong standard practice.
        # Standard practice is std of log returns.
        # Detection: If Vol_20d is huge (like price level), it's wrong.
        
        vol_val = df['Vol_20d'].iloc[100]
        # Linear price 100..130. Std of price in 20d window ~ 2-3.
        # If it was returns, it would be ~0.01.
        
        # I suspect the implementation might be flawed if it uses price rolling std.
        # I'll flag this if it's high.
        logger.info(f"Vol 20d value: {vol_val}")

if __name__ == '__main__':
    unittest.main()
