import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QuantitativeDataClient:
    def __init__(self):
        pass

    def fetch_market_data(self, db: Session, tickers: list[str], period: str = "2y", end_date: datetime | None = None) -> dict:
        """
        Fetches historical market data for a list of tickers from DB.
        Syncs if missing (only if end_date is None or recent).
        
        Args:
            end_date: The "current" date for the simulation. Data after this is hidden.
        """
        if not tickers:
            return {}

        logger.info(f"Fetching market data for {len(tickers)} tickers from DB...")
        from app.services.market_data_service import MarketDataService
        from app.models.market_data import MarketData
        
        structured_data = {}
        
        # Determine effective end date
        if end_date is None:
            end_date = datetime.utcnow()
        
        # Determine start date based on period (approx)
        start_date = end_date - timedelta(days=730) # Default 2y
        if period == "1y":
            start_date = end_date - timedelta(days=365)
        elif period == "6m":
            start_date = end_date - timedelta(days=180)
             
        for ticker in tickers:
            # 1. Check DB
            # We fetch all data between start and end
            rows = db.query(MarketData).filter(
                MarketData.ticker == ticker,
                MarketData.date >= start_date,
                MarketData.date <= end_date
            ).order_by(MarketData.date.asc()).all()
            
            # Simple heuristic: if we have few rows, or last date is old, sync.
            # ONLY SYNC IF we are asking for recent data (Realtime mode). 
            # If we are strictly backtesting (end_date < now - 2days), DO NOT SYNC.
            should_sync = False
            is_historical_request = end_date < (datetime.utcnow() - timedelta(days=2))
            
            if not is_historical_request:
                if not rows:
                    should_sync = True
                elif rows[-1].date < end_date - timedelta(days=2): # Allow weekend gap
                    should_sync = True
                
            if should_sync:
                success = MarketDataService.sync_ticker(db, ticker, period)
                if success:
                    # Re-fetch
                    rows = db.query(MarketData).filter(
                        MarketData.ticker == ticker,
                        MarketData.date >= start_date,
                        MarketData.date <= end_date
                    ).order_by(MarketData.date.asc()).all()
            
            if not rows:
                logger.warning(f"No data available for {ticker} after sync.")
                continue

            # Convert to DataFrame
            data = [{
                "Date": r.date,
                "Open": r.open,
                "High": r.high,
                "Low": r.low,
                "Close": r.close,
                "Volume": r.volume
            } for r in rows]
            
            df = pd.DataFrame(data).set_index("Date")
            structured_data[ticker] = df
            
        return structured_data

    def fetch_fundamentals(self, tickers: list[str]) -> pd.DataFrame:
        """
        Fetches fundamental data (P/E, Market Cap, etc.) concurrently.
        """
        import concurrent.futures
        
        logger.info(f"Fetching fundamentals for {len(tickers)} tickers...")
        fundamentals = []
        
        def _fetch_single(t):
            # Ticker symbol adjustment
            pt = f"{t}.NS" if not t.endswith((".NS", ".BO", ".US")) else t
            try:
                stock = yf.Ticker(pt)
                info = stock.info
                # Extract key metrics with safe defaults
                return {
                    "symbol": t,
                    "market_cap": info.get("marketCap", np.nan),
                    "pe_ratio": info.get("trailingPE", np.nan),
                    "pb_ratio": info.get("priceToBook", np.nan),
                    "roe": info.get("returnOnEquity", np.nan),
                    "profit_margins": info.get("profitMargins", np.nan),
                    "revenue_growth": info.get("revenueGrowth", np.nan),
                    "debt_to_equity": info.get("debtToEquity", np.nan),
                    "free_cashflow": info.get("freeCashflow", np.nan),
                    "sector": info.get("sector", "Unknown"),
                    "industry": info.get("industry", "Unknown")
                }
            except Exception as e:
                logger.warning(f"Failed to fetch fundamentals for {t}: {e}")
                return None

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = executor.map(_fetch_single, tickers)
            
        fundamentals = [r for r in results if r is not None]
        return pd.DataFrame(fundamentals)

    def _std_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Standardizes column names to: Open, High, Low, Close, Volume.
        Handles 'Adj Close' fallback.
        """
        # Check for Close/Adj Close
        if 'Adj Close' in df.columns:
            df['Close'] = df['Adj Close'] # Use Adjusted Close for everything
        
        required = ['Open', 'High', 'Low', 'Close', 'Volume']
        available = [c for c in required if c in df.columns]
        
        return df[available]
