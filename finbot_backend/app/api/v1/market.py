from fastapi import APIRouter, Query
import pandas as pd
import os

router = APIRouter(prefix="/market", tags=["market"])

# Path to the CSV file
# Assuming app structure: app/api/v1/market.py -> app/data/EQUITY_L.csv is ../../data/EQUITY_L.csv
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CSV_PATH = os.path.join(BASE_DIR, "data", "EQUITY_L.csv")

df_stocks = None

def load_data():
    global df_stocks
    if df_stocks is None:
        try:
            if os.path.exists(CSV_PATH):
                df_stocks = pd.read_csv(CSV_PATH)
                # Clean column names just in case
                df_stocks.columns = [c.strip() for c in df_stocks.columns]
                print(f"Loaded {len(df_stocks)} stocks from {CSV_PATH}")
            else:
                print(f"Warning: Stock data not found at {CSV_PATH}")
                df_stocks = pd.DataFrame(columns=["SYMBOL", "NAME OF COMPANY"])
        except Exception as e:
            print(f"Error loading stock data: {e}")
            df_stocks = pd.DataFrame(columns=["SYMBOL", "NAME OF COMPANY"])

# Load data on import
load_data()

from app.schemas.response import APIResponse

@router.get("/search", response_model=APIResponse[list[dict]])
def search_stocks(q: str = Query(..., min_length=1)):
    try:
        import yfinance as yf
        # yfinance doesn't have a direct search API that is reliable without unofficial libs.
        # But we can use the Yahoo Finance autocomplete API directly or just rely on the local CSV if it was better.
        # Given the "REAL data" requirement, we'll try to use the CSV for *searching* symbols (as a directory)
        # and yfinance for *validating/fetching* data.
        # Re-using the local CSV for search is faster and safer for "search" than hitting an external API 
        # that might block us.
        
        global df_stocks
        if df_stocks is None or df_stocks.empty:
             # Fallback to a simple list if CSV missing, or return empty
             return APIResponse(success=True, data=[])

        query = q.lower()
        mask = (
            df_stocks['SYMBOL'].str.lower().str.contains(query, na=False) | 
            df_stocks['NAME OF COMPANY'].str.lower().str.contains(query, na=False)
        )
        # 1. Exact/Substring Matches
        results_df = df_stocks[mask].head(10)
        
        output = []
        seen_symbols = set()
        
        for _, row in results_df.iterrows():
            output.append({
                "symbol": str(row['SYMBOL']) + ".NS",
                "name": row['NAME OF COMPANY'],
                "exchange": "NSE"
            })
            seen_symbols.add(row['SYMBOL'])

        # 2. Fuzzy Matches (If we have space)
        if len(output) < 10 and len(query) > 1:
            import difflib
            
            # Get all symbols for fuzzy matching
            all_symbols = df_stocks['SYMBOL'].dropna().astype(str).tolist()
            
            # Fuzzy match on Symbol
            close_symbols = difflib.get_close_matches(query.upper(), all_symbols, n=5, cutoff=0.6)
            
            for sym in close_symbols:
                if sym not in seen_symbols:
                    # Find the row for this symbol
                    match_rows = df_stocks[df_stocks['SYMBOL'] == sym]
                    if not match_rows.empty:
                        row = match_rows.iloc[0]
                        output.append({
                            "symbol": str(row['SYMBOL']) + ".NS",
                            "name": row['NAME OF COMPANY'],
                            "exchange": "NSE"
                        })
                        seen_symbols.add(sym)
                    if len(output) >= 10:
                        break
        
        return APIResponse(success=True, data=output)

    except Exception as e:
        print(f"Search error: {e}")
        return APIResponse(success=False, error=str(e), data=[])

@router.get("/quote/{symbol}", response_model=APIResponse[dict])
def get_quote(symbol: str):
    import yfinance as yf
    try:
        # Append .NS if not present and if it looks like an Indian stock (simple heuristic or force it)
        # The user's CSV seems to be NSE data ("EQUITY_L.csv" is common NSE filename).
        ticker_symbol = symbol
        if not ticker_symbol.endswith(".NS") and not ticker_symbol.endswith(".BO"):
            ticker_symbol = f"{symbol}.NS"
        
        ticker = yf.Ticker(ticker_symbol)
        # fast_info is faster than info
        info = ticker.fast_info
        
        # fast_info provides: last_price, previous_close, day_high, day_low, etc.
        price = info.last_price
        prev_close = info.previous_close
        
        change = price - prev_close
        change_percent = (change / prev_close) * 100 if prev_close else 0
        
        return APIResponse(success=True, data={
            "symbol": symbol.upper(),
            "price": price,
            "change": change,
            "changePercent": change_percent,
            "low": info.day_low,
            "high": info.day_high,
            "name": ticker_symbol # valid yfinance ticker
        })

    except Exception as e:
        print(f"Quote error for {symbol}: {e}")
        return APIResponse(success=False, error=str(e), data={
            "symbol": symbol.upper(),
            "price": 0,
            "change": 0,
            "changePercent": 0,
            "error": str(e)
        })
