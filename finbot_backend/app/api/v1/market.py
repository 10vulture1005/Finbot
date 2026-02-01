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

@router.get("/search")
def search_stocks(q: str = Query(..., min_length=1)):
    global df_stocks
    if df_stocks is None or df_stocks.empty:
        return []
    
    query = q.lower()
    
    # 1. Exact Substring Matches (High Priority)
    mask = (
        df_stocks['SYMBOL'].str.lower().str.contains(query, na=False) | 
        df_stocks['NAME OF COMPANY'].str.lower().str.contains(query, na=False)
    )
    exact_matches = df_stocks[mask].head(10)
    
    results = []
    seen_symbols = set()

    # Add exact matches first
    for _, row in exact_matches.iterrows():
        results.append({
            "symbol": row['SYMBOL'],
            "name": row['NAME OF COMPANY'],
            "exchange": "NSE"
        })
        seen_symbols.add(row['SYMBOL'])
        
    # 2. Fuzzy Matches (If we have space)
    if len(results) < 10 and len(query) > 2:
        import difflib
        
        # Get all symbols and names as lists for fuzzy matching
        all_symbols = df_stocks['SYMBOL'].dropna().astype(str).tolist()
        # all_names = df_stocks['NAME OF COMPANY'].dropna().astype(str).tolist() # Too slow for full fuzzy on names
        
        # Fuzzy match on Symbol
        close_symbols = difflib.get_close_matches(query.upper(), all_symbols, n=5, cutoff=0.6)
        
        for sym in close_symbols:
            if sym not in seen_symbols:
                # Find the row for this symbol
                row = df_stocks[df_stocks['SYMBOL'] == sym].iloc[0]
                results.append({
                    "symbol": row['SYMBOL'],
                    "name": row['NAME OF COMPANY'],
                    "exchange": "NSE"
                })
                seen_symbols.add(sym)
                if len(results) >= 10:
                    break
                    
    return results[:10]

@router.get("/quote/{symbol}")
def get_quote(symbol: str):
    import requests
    
    # Check for access token in env (optional)
    access_token = os.getenv("GROWW_ACCESS_TOKEN")

    url = "https://api.groww.in/v1/live-data/quote"
    params = {
        "exchange": "NSE",
        "segment": "CASH",
        "trading_symbol": symbol.upper()
    }
    headers = {
        "Accept": "application/json",
        "X-API-VERSION": "1.0"
    }
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"

    try:
        response = requests.get(url, params=params, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # Extract relevant fields
        # Structure varies, assume:
        # { "ltp": 123.45, "dayChange": 1.2, "dayChangePerc": 0.5, ... }
        # Need to verify structure from user prompt or assumption.
        # User output didn't show response structure, only request.
        # Standard Groww response usually has 'ltp', 'close', etc.
        
        return {
            "symbol": symbol.upper(),
            "price": data.get('ltp', 0),
            "change": data.get('dayChange', 0),
            "changePercent": data.get('dayChangePerc', 0),
            "low": data.get('low', 0),
            "high": data.get('high', 0)
        }
    except Exception as e:
        print(f"Error fetching quote for {symbol}: {e}")
        # Return fallback/error structure
        return {
            "symbol": symbol.upper(),
            "price": 0,
            "change": 0,
            "changePercent": 0,
            "error": str(e)
        }
