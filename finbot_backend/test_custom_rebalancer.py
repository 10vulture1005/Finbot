import os
import sys

# Add backend directory to sys path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from app.db.session import SessionLocal
from app.models.user import User
from app.models.portfolio import PortfolioStock

# Import the portfolio-rebalancer classes/functions
import sys
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "portfolio-rebalancer"))
from portfolio import Portfolio, Asset
from rebalance import full_rebalance
import json
import yfinance as yf
import json

def create_mock_user_and_portfolio(db, symbols, amounts):
    # Try finding an existing mock user or create one
    mock_email = "testrebalance@example.com"
    user = db.query(User).filter_by(email=mock_email).first()
    
    if not user:
        user = User(
            email=mock_email,
            name="Test Rebalance User",
            hashed_password="dummy_password"
        )
        db.add(user)
        db.commit()
        
    # Clear existing holdings for this test user
    db.query(PortfolioStock).filter_by(user_id=user.id).delete()
    db.commit()
    
    # Add new holdings
    print(f"Adding holdings for {mock_email}...")
    for symbol, amount in zip(symbols, amounts):
        stock = PortfolioStock(
            user_id=user.id,
            symbol=symbol,
            quantity=amount, # Assume quantity for simplicity
            avg_price=100.0, # Dummy price
            weight_target=1.0 / len(symbols),
            purchase_date=datetime.utcnow()
        )
        db.add(stock)
    db.commit()
    
    return user

def main():
    db = SessionLocal()
    
    # 1. Define the stocks you want to test
    # Ensure to add .NS for Indian stocks if needed by the backend
    symbols_to_test = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "YESBANK"]
    
    # Define how many shares of each you own
    quantities = [10, 50, 100, 20, 5000]
    
    print("\nSetting up mock portfolio...")
    print(f"Stocks: {symbols_to_test}")
    print(f"Quantities: {quantities}")
    
    user = create_mock_user_and_portfolio(db, symbols_to_test, quantities)
    
    print("\nRunning Standalone Rebalancer (full_rebalance)...")
    
    # Needs prices for the assets. Fetching from yfinance for accuracy
    prices = {}
    print("Fetching current prices...")
    for sym in symbols_to_test:
        ticker_symbol = sym if (sym.endswith(".NS") or sym.endswith(".BO") or sym.endswith(".US")) else f"{sym}.NS"
        try:
            ticker = yf.Ticker(ticker_symbol)
            prices[sym] = ticker.fast_info.last_price
        except Exception as e:
            print(f"Failed to fetch price for {sym}: {e}")
            prices[sym] = 100.0 # Fallback
            
    print(f"Prices: {prices}")

    # Create Portfolio and Assets
    portfolio = Portfolio()
    equal_weight = 100.0 / len(symbols_to_test)
    
    for sym, qty in zip(symbols_to_test, quantities):
        # Asset(ticker, shares, currency, target_allocation)
        asset = Asset(sym, qty, "INR", equal_weight)
        asset.group = "Equities"
        asset.adjust = 1
        portfolio.add_asset(asset)

    try:
        suggestions = full_rebalance(
            portfolio, 
            prices, 
            "INR", 
            use_ceil=False, 
            distribute_across_adjustables=True
        )
        
        print("\n=== Suggested Trades ===")
        if not suggestions:
            print("No rebalancing needed (already at target).")
        else:
            for trade in suggestions:
                direction = trade["action"]
                qty = trade["shares"]
                sym = trade["ticker"]
                price = prices[sym]
                print(f"{direction} {qty:.2f} shares of {sym} @ ₹{price:.2f}")
                
    except Exception as e:
        print(f"\nError running rebalancer: {e}")
        
    finally:
        # Cleanup
        db.query(PortfolioStock).filter_by(user_id=user.id).delete()
        db.query(User).filter_by(email="testrebalance@example.com").delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    main()
