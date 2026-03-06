import yfinance as yf
import pandas as pd

def test_download(tickers):
    print(f"\n--- Testing for: {tickers} ---")
    try:
        data = yf.download(tickers, period="5d", interval="1d", progress=False, timeout=10)
        print("Columns:", data.columns)
        print("Head:\n", data.head())
        
        try:
            print("Accessing 'Adj Close':")
            print(data['Adj Close'].head())
        except KeyError as e:
            print(f"KeyError accessing 'Adj Close': {e}")
            
        try:
            print("Accessing 'Close':")
            print(data['Close'].head())
        except KeyError as e:
            print(f"KeyError accessing 'Close': {e}")

    except Exception as e:
        print(f"Download failed: {e}")

print("yfinance version:", yf.__version__)
test_download(["RELIANCE.NS"])
test_download(["RELIANCE.NS", "TCS.NS"])
