import pandas as pd
import numpy as np

class FeatureEngineer:
    def __init__(self):
        pass

    def compute_technical_features(self, df: pd.DataFrame, market_df: pd.DataFrame = None) -> pd.DataFrame:
        """
        Computes technical indicators for a single ticker DataFrame.
        Expected columns: Open, High, Low, Close, Volume
        """
        if df.empty:
            return df
        
        # Ensure calculated on copy
        df = df.copy()
        close = df['Close']
        
        # --- Trend (EMA) ---
        df['EMA_50'] = close.ewm(span=50, adjust=False).mean()
        df['EMA_200'] = close.ewm(span=200, adjust=False).mean()
        df['Dist_EMA_50'] = (close / df['EMA_50']) - 1
        df['Dist_EMA_200'] = (close / df['EMA_200']) - 1
        
        # --- RSI (14) ---
        delta = close.diff()
        gain = (delta.where(delta > 0, 0)).ewm(alpha=1/14, adjust=False).mean()
        loss = (-delta.where(delta < 0, 0)).ewm(alpha=1/14, adjust=False).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # --- MACD (12, 26, 9) ---
        exp1 = close.ewm(span=12, adjust=False).mean()
        exp2 = close.ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        
        # --- Bollinger Bands (20, 2) ---
        ma20 = close.rolling(window=20).mean()
        std20 = close.rolling(window=20).std()
        df['BB_UP'] = ma20 + (std20 * 2)
        df['BB_LOW'] = ma20 - (std20 * 2)
        df['BB_Width'] = (df['BB_UP'] - df['BB_LOW']) / ma20
        
        # --- Volatility ---
        rets = close.pct_change()
        df['Vol_20d'] = rets.rolling(20).std() * np.sqrt(252) # Annualized
        df['Vol_60d'] = rets.rolling(60).std() * np.sqrt(252)
        
        # --- Momentum (Returns) ---
        df['Ret_5d'] = close.pct_change(5)
        df['Ret_20d'] = close.pct_change(20)
        df['Ret_60d'] = close.pct_change(60)
        df['Ret_120d'] = close.pct_change(120)
        
        # --- Volume Surge ---
        # Handle 0 volume
        vol_ma = df['Volume'].rolling(20).mean()
        df['Vol_Surge'] = df['Volume'] / vol_ma.replace(0, 1)
        
        # --- Market Features (Beta/Corr) ---
        if market_df is not None and not market_df.empty:
             # Align dates
             common_idx = df.index.intersection(market_df.index)
             if len(common_idx) > 60:
                 asset_ret = df.loc[common_idx, 'Close'].pct_change()
                 mkt_ret = market_df.loc[common_idx, 'Close'].pct_change()
                 
                 # Rolling Correlation (60d)
                 df.loc[common_idx, 'Mkt_Corr_60d'] = asset_ret.rolling(60).corr(mkt_ret)
                 
                 # Rolling Beta (60d)
                 cov = asset_ret.rolling(60).cov(mkt_ret)
                 var = mkt_ret.rolling(60).var()
                 df.loc[common_idx, 'Beta_60d'] = cov / var
        
        return df

    def compute_regression_target(self, df: pd.DataFrame, horizon: int = 20) -> pd.DataFrame:
        """
        Computes regression target: Forward 20-day return.
        Target[t] = (Price[t+20] / Price[t]) - 1
        """
        # Forward returns (Shifted backwards to align with T)
        df[f'Target_{horizon}d'] = df['Close'].shift(-horizon) / df['Close'] - 1
        
        return df
