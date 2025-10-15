import pandas as pd
import pandas_ta as ta


class IndicatorCalculator:
    def calculate_rsi(df, period=14):
        rsi = ta.rsi(df["CLOSE"], length=period)
        df['RSI'] = rsi  # Assign with explicit column name
        return df


    def calculate_macd(df, fast=12, slow=26, signal=9):
        """
        Calculate MACD (Moving Average Convergence Divergence)
        
        Args:
            df (pd.DataFrame): DataFrame containing price data
            fast (int): Fast EMA period (default: 12)
            slow (int): Slow EMA period (default: 26)
            signal (int): Signal line period (default: 9)
        
        Returns:
            tuple: (MACD line, Signal line, MACD Histogram)
        """
        # Extract the Close price series
        close_prices = df['CLOSE']
        
        ema_fast = close_prices.ewm(span=fast, adjust=False).mean()
        ema_slow = close_prices.ewm(span=slow, adjust=False).mean()
        
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        macd_histogram = macd_line - signal_line
        
        return macd_line, signal_line, macd_histogram


    def calculate_bollinger_bands(df, period=20, std_dev=2):
        bbands = ta.bbands(df["CLOSE"], length=period, std=std_dev)
        # Rename columns to match expected names
        df['BB_Lower'] = bbands[f'BBL_{period}_{std_dev}.0']
        df['BB_Middle'] = bbands[f'BBM_{period}_{std_dev}.0']
        df['BB_Upper'] = bbands[f'BBU_{period}_{std_dev}.0']
        return df