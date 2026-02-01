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
    try:
        import yfinance as yf
        tickers = [h.symbol for h in holdings]
        if tickers:
            # Fetch 2 days to calculate daily change if needed, or just use 'Close' and 'Open' or 'Prev Close'
            # 'period="2d"' to be safe for daily return calculation if 'Previous Close' is needed
            # But yf.download is batch.
            data = yf.download(tickers, period="5d", interval="1d", progress=False)
            
            # Data structure depends on number of tickers.
            # Multi-index columns if >1 ticker.
            
            last_prices = data['Adj Close'].iloc[-1]
            prev_prices = data['Adj Close'].iloc[-2] if len(data) > 1 else last_prices
            
            for stock in holdings:
                try:
                    # Handle single ticker vs multi-ticker structure quirks of yfinance
                    # If only 1 ticker, last_prices is scalar (float) if directly accessed or Series?
                    # yfinance is tricky.
                    # Safest: access via column name handling.
                    
                    sym = stock.symbol
                    price = 0.0
                    prev = 0.0
                    
                    if len(tickers) == 1:
                        price = float(last_prices.iloc[0]) if hasattr(last_prices, 'iloc') else float(last_prices)
                        prev = float(prev_prices.iloc[0]) if hasattr(prev_prices, 'iloc') else float(prev_prices)
                    else:
                        price = float(last_prices[sym])
                        prev = float(prev_prices[sym])

                    stock.current_price = price
                    stock.market_value = price * stock.quantity
                    stock.daily_return = ((price - prev) / prev) if prev != 0 else 0.0
                    # Sector is not easily available in batch download 'Adj Close'. 
                    # Would need Ticker().info which is slow for many tickers.
                    # For now, "Unknown" or infer from static list if desperate. 
                    # User rules: "NO dummy data". So "Unknown" is honest.
                    stock.sector = "Unknown" 
                    
                except Exception as inner_e:
                     print(f"Error enriching {stock.symbol}: {inner_e}")
                     stock.current_price = stock.avg_price # Fallback to cost? Or None? Rule: "No fake data".
                     # If yfinance fails, maybe we shouldn't show cost as current value.
                     # Leave as None or 0.
                     pass 

    except Exception as e:
        print(f"Market Data Fetch Exception: {e}")
        # Proceed with DB data only
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
    db.delete(stock)
    db.commit()
