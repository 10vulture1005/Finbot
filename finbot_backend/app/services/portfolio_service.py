from sqlalchemy.orm import Session
from app.models.portfolio import PortfolioStock
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate
import httpx

def add_stock(db: Session, user_id: int, data: PortfolioCreate):
    stock = PortfolioStock(
        user_id=user_id,
        symbol=data.symbol,
        quantity=data.quantity,
        avg_price=data.avg_price
    )
    db.add(stock)
    db.commit()
    db.refresh(stock)
    return stock

def get_portfolio(db: Session, user_id: int):
    holdings = db.query(PortfolioStock).filter_by(user_id=user_id).all()
    
    if not holdings:
        return []

    # Enrich with Real Market Data
    # Static sector cache for common large-cap stocks (fast path)
    sector_cache = {
        "RELIANCE": "Energy", "TCS": "Technology", "HDFCBANK": "Financial Services",
        "INFY": "Technology", "ICICIBANK": "Financial Services", "HINDUNILVR": "Consumer Defensive",
        "ITC": "Consumer Defensive", "SBIN": "Financial Services", "BHARTIARTL": "Communication Services",
        "KOTAKBANK": "Financial Services", "LT": "Industrials", "BAJFINANCE": "Financial Services",
        "ASIANPAINT": "Consumer Cyclical", "MARUTI": "Consumer Cyclical", "TITAN": "Consumer Cyclical",
        "AXISBANK": "Financial Services", "SUNPHARMA": "Healthcare", "WIPRO": "Technology",
        "ULTRACEMCO": "Basic Materials", "POWERGRID": "Utilities", "NESTLEIND": "Consumer Defensive",
        "M&M": "Consumer Cyclical", "TATASTEEL": "Basic Materials", "JSWSTEEL": "Basic Materials",
        "TATAMOTORS": "Consumer Cyclical", "NTPC": "Utilities", "HCLTECH": "Technology",
        "ONGC": "Energy", "COALINDIA": "Energy", "INDUSINDBK": "Financial Services"
    }

    def fetch_sector_from_api(symbol: str) -> str:
        """Fetch the mgSector for a stock symbol using the indianapi.in industry_search endpoint."""
        try:
            from app.core.config import settings
            from urllib.parse import quote
            if not settings.NEWS_API:
                return "Unknown"
            # Strip exchange suffixes to get the bare NSE code e.g. "RELIANCE"
            clean_sym = symbol.replace(".NS", "").replace(".BO", "").strip()
            if not clean_sym:
                return "Unknown"
            headers = {"X-Api-Key": settings.NEWS_API}
            # URL-encode the query to handle special chars like M&M
            url = f"https://stock.indianapi.in/industry_search?query={quote(clean_sym)}"
            with httpx.Client(timeout=6.0) as client:
                resp = client.get(url, headers=headers)
                if resp.status_code != 200:
                    print(f"[sector_api] HTTP {resp.status_code} for {symbol}: {resp.text[:200]}")
                    return "Unknown"
                results = resp.json()
                if isinstance(results, list) and results:
                    # 1. Prefer exact NSI code match
                    for item in results:
                        nsi_code = item.get("exchangeCodeNsi", "")
                        if nsi_code and nsi_code.upper() == clean_sym.upper():
                            return item.get("mgSector", "Unknown")
                    # 2. Fallback to first result
                    return results[0].get("mgSector", "Unknown")
        except Exception as e:
            print(f"[sector_api] Failed to fetch sector for {symbol}: {e}")
        return "Unknown"

    try:
        import yfinance as yf
        tickers = [h.symbol for h in holdings]
        if tickers:
            # 1. Fetch Price Data (Fast, Batch)
            # Fail fast if yfinance hangs
            try:
                data = yf.download(tickers, period="5d", interval="1d", progress=False, timeout=10)
            except Exception as e:
                print(f"YF Download Error: {e}")
                data = None

            if data is not None and not data.empty:
                # Check which column to use: Adj Close or Close
                price_key = 'Adj Close' if 'Adj Close' in data.columns.get_level_values(0) else 'Close'
                
                try:
                    price_data = data[price_key]
                    
                    last_prices = price_data.iloc[-1]
                    prev_prices = price_data.iloc[-2] if len(price_data) > 1 else last_prices
                    
                    for stock in holdings:
                        try:
                            sym = stock.symbol
                            price = 0.0
                            prev = 0.0
                            
                            import math
                            
                            # Price logic (same as before)
                            if sym in last_prices:
                                price = float(last_prices[sym])
                                prev = float(prev_prices[sym])
                            elif f"{sym}.NS" in last_prices:
                                price = float(last_prices[f"{sym}.NS"])
                                prev = float(prev_prices[f"{sym}.NS"])
                            elif len(holdings) == 1 and isinstance(last_prices, (float, int)):
                                 price = float(last_prices)
                                 prev = float(prev_prices)
                            elif len(holdings) == 1 and len(last_prices) == 1:
                                 price = float(last_prices.iloc[0])
                                 prev = float(prev_prices.iloc[0])

                            if math.isnan(price): price = 0.0
                            if math.isnan(prev): prev = 0.0

                            if price != 0:
                                stock.current_price = price
                                stock.market_value = price * stock.quantity
                                stock.daily_return = ((price - prev) / prev) if prev != 0 else 0.0
                                
                        except Exception as inner_e:
                            pass
                except Exception as e:
                     print(f"Error processing price data: {e}")

            # 2. Enrich Sector - static cache first, then live API fallback
            for stock in holdings:
                clean = stock.symbol.replace(".NS", "").replace(".BO", "")
                if clean in sector_cache:
                    stock.sector = sector_cache[clean]
                else:
                    # Call News API industry_search for real sector data
                    fetched = fetch_sector_from_api(stock.symbol)
                    stock.sector = fetched
                    # Cache the result for subsequent calls in this request
                    sector_cache[clean] = fetched

    except Exception as e:
        print(f"Market Data Fetch Exception (Timeout/Error): {e}")
        pass

    return holdings

def update_stock(db: Session, stock_id: int, user_id: int, data: PortfolioUpdate):
    stock = db.query(PortfolioStock).filter_by(id=stock_id, user_id=user_id).first()
    stock.quantity = data.quantity
    stock.avg_price = data.avg_price
    db.commit()
    return stock

def delete_stock(db: Session, stock_id: int, user_id: int):
    stock = db.query(PortfolioStock).filter_by(id=stock_id, user_id=user_id).first()
    if stock:
        db.delete(stock)
        db.commit()
    return stock

def delete_all_stocks(db: Session, user_id: int):
    db.query(PortfolioStock).filter_by(user_id=user_id).delete()
    db.commit()

from app.models.portfolio_history import PortfolioHistory

def get_portfolio_history(db: Session, user_id: int):
    return db.query(PortfolioHistory).filter_by(user_id=user_id).order_by(PortfolioHistory.date).all()


import datetime
import math
import numpy as np

def get_portfolio_analytics(db: Session, user_id: int):
    holdings = get_portfolio(db, user_id)
    history = get_portfolio_history(db, user_id)
    
    # 1. Growth Trajectory
    growth = []
    if history:
        for p in history:
            growth.append({
                "date": p.date.strftime("%Y-%m-%d") if isinstance(p.date, datetime.datetime) else str(p.date),
                "value": float(p.total_value)
            })
    else:
        # Fallback if no history: mock a 30-day growth based on current value
        current_total = sum((h.market_value or (h.quantity * h.current_price)) for h in holdings) if holdings else 0
        if current_total > 0:
            today = datetime.datetime.now()
            for i in range(30, -1, -1):
                d = today - datetime.timedelta(days=i)
                # Random walk simulation
                sim_val = current_total * (1 + ((-15 + i)/100))
                growth.append({
                    "date": d.strftime("%Y-%m-%d"),
                    "value": round(sim_val, 2)
                })

    # 2. Asset Allocation
    allocation = []
    total_val = sum((h.market_value or (h.quantity * h.current_price)) for h in holdings) if holdings else 0
    if total_val > 0:
        for h in holdings:
            val = h.market_value or (h.quantity * h.current_price)
            allocation.append({
                "symbol": h.symbol,
                "value": round(val, 2),
                "percentage": round((val / total_val) * 100, 2)
            })

    # 3. Sector Diversification
    sectors_map = {}
    if total_val > 0:
        for h in holdings:
            val = h.market_value or (h.quantity * h.current_price)
            sec = h.sector or "Unknown"
            sectors_map[sec] = sectors_map.get(sec, 0) + val
            
    sectors = [{"name": k, "value": round(v, 2), "percentage": round((v / total_val) * 100, 2)} for k, v in sectors_map.items()]

    # 4. Risk Analysis (Simplified using daily returns or proxy)
    # Re-use history if available, else mock based on weights (simple proxy)
    volatility = 0.0
    max_drawdown = 0.0
    sharpe_ratio = 0.0
    risk_score = "Medium"
    
    if len(growth) > 1:
        vals = [g["value"] for g in growth]
        returns = [(vals[i] - vals[i-1])/vals[i-1] for i in range(1, len(vals))]
        
        # Ann. Volatility
        volatility = float(np.std(returns) * np.sqrt(252))
        
        # Max Drawdown
        peak = vals[0]
        md = 0.0
        for v in vals:
            if v > peak: peak = v
            dd = (peak - v) / peak
            if dd > md: md = dd
        max_drawdown = float(md)
        
        # Sharpe (Risk free rate ~ 5% ann)
        ann_ret = float(np.mean(returns) * 252)
        sharpe_ratio = (ann_ret - 0.05) / volatility if volatility > 0 else 0
        
        if volatility > 0.25:
            risk_score = "High"
        elif volatility < 0.10:
            risk_score = "Low"
            
    return {
        "growth": growth,
        "allocation": allocation,
        "sectors": sectors,
        "risk": {
            "volatility": round(volatility, 4),
            "max_drawdown": round(max_drawdown, 4),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "risk_score": risk_score
        }
    }


def get_portfolio_growth(db: Session, user_id: int) -> list:
    """
    Build a 30-day portfolio value timeline using real yfinance historical prices.
    For each trading day, portfolio_value = sum(price_on_day * quantity) for all holdings.
    Falls back to portfolio_history DB records if yfinance data is unavailable.
    """
    import yfinance as yf
    import datetime
    import math
    import pandas as pd

    holdings = db.query(PortfolioStock).filter_by(user_id=user_id).all()

    # Try DB history first (most accurate)
    history = db.query(PortfolioHistory).filter_by(user_id=user_id).order_by(PortfolioHistory.date).all()
    if history and len(history) >= 5:
        return [
            {
                "date": h.date.strftime("%Y-%m-%d") if isinstance(h.date, datetime.datetime) else str(h.date),
                "value": float(h.total_value)
            }
            for h in history[-60:]  # last 60 entries max
        ]

    if not holdings:
        return []

    # Compute growth from yfinance historical prices
    tickers = []
    qty_map = {}  # symbol -> quantity
    for h in holdings:
        sym = h.symbol if h.symbol.endswith(".NS") or h.symbol.endswith(".BO") else f"{h.symbol}.NS"
        tickers.append(sym)
        qty_map[sym] = h.quantity

    try:
        raw = yf.download(tickers, period="35d", interval="1d", progress=False, timeout=15)
        if raw is None or raw.empty:
            return []

        price_key = "Adj Close" if "Adj Close" in raw.columns.get_level_values(0) else "Close"
        prices = raw[price_key]

        # For a single ticker, yfinance returns a Series not a DataFrame
        if isinstance(prices, pd.Series):
            prices = prices.to_frame(name=tickers[0])

        result = []
        for date_idx in prices.index:
            daily_value = 0.0
            valid = False
            for sym in tickers:
                qty = qty_map.get(sym, 0)
                try:
                    price = float(prices.at[date_idx, sym])
                    if not math.isnan(price) and price > 0:
                        daily_value += price * qty
                        valid = True
                except Exception:
                    pass
            if valid and daily_value > 0:
                date_str = date_idx.strftime("%Y-%m-%d") if hasattr(date_idx, "strftime") else str(date_idx)[:10]
                result.append({"date": date_str, "value": round(daily_value, 2)})

        return result

    except Exception as e:
        print(f"[portfolio_growth] yfinance error: {e}")
        return []
