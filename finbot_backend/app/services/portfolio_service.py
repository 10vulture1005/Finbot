from sqlalchemy.orm import Session
from app.models.portfolio import PortfolioStock
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate

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
    # Sector Cache (Simple in-memory for this session)
    # Ideally use Redis or DB
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

            # 2. Enrich Sector (Slower, Individual or Cached)
            for stock in holdings:
                if stock.symbol in sector_cache:
                    stock.sector = sector_cache[stock.symbol]
                else:
                    # Fallback or try fetch (careful with rate limits/latency)
                    # For a demo/user-input, we can try fetching if list is small
                    # Or keep as "Unknown" to avoid 10s load times
                    stock.sector = "Unknown" 
                    # Uncomment if acceptable latency:
                    # try:
                    #     info = yf.Ticker(stock.symbol + ".NS").info
                    #     s = info.get('sector')
                    #     if s: 
                    #         stock.sector = s
                    #         sector_cache[stock.symbol] = s # Update cache
                    # except: 
                    #     pass

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
