import yfinance as yf
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.models.market_data import MarketData
import logging

logger = logging.getLogger(__name__)

class MarketDataService:
    @staticmethod
    def sync_ticker(db: Session, ticker: str, period: str = "2y"):
        """
        Fetches data from yfinance, validates it, and upserts to DB.
        """
        logger.info(f"Syncing market data for {ticker}...")
        
        import requests
        
        # 1. Fetch
        # Add suffix if needed, similar to data_loader heuristics
        yf_ticker = ticker
        if not ticker.endswith((".NS", ".BO", ".US")):
             yf_ticker = f"{ticker}.NS"
             
        try:
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })
            df = yf.download(yf_ticker, period=period, interval="1d", progress=False, group_by='ticker', auto_adjust=False, session=session)
            if df.empty:
                logger.warning(f"No data found for {ticker}")
                return False
                
            # If multi-index (common in recent yfinance versions), flatten
            if isinstance(df.columns, pd.MultiIndex):
                 # Check if top level is ticker
                 if len(df.columns.levels[0]) == 1:
                     df = df.droplevel(0, axis=1)
                 else:
                     # Attempt to extract if specific ticker is column
                     if yf_ticker in df.columns:
                         df = df[yf_ticker]
                     
            
            # Standardize columns
            if 'Adj Close' in df.columns:
                df['Close'] = df['Adj Close']
            
            required = ['Open', 'High', 'Low', 'Close', 'Volume']
            if not all(col in df.columns for col in required):
                logger.error(f"Missing columns for {ticker}: {df.columns}")
                return False

            # 2. Validate & Prepare
            records = []
            for index, row in df.iterrows():
                date = index
                if not isinstance(date, datetime):
                     date = pd.to_datetime(date)
                
                # Validation Rules
                if row['High'] < row['Low']:
                    logger.warning(f"Invalid High/Low for {ticker} on {date}. Skipping.")
                    continue
                if row['Close'] <= 0:
                     logger.warning(f"Invalid Close price for {ticker} on {date}. Skipping.")
                     continue
                if row['Volume'] < 0:
                     logger.warning(f"Invalid Volume for {ticker} on {date}. Skipping.")
                     continue
                
                records.append({
                    "ticker": ticker, # Store ORIGINAL ticker without suffix
                    "date": date,
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": float(row['Volume']),
                    "last_updated": datetime.utcnow()
                })
            
            if not records:
                return True # Nothing valid to save is arguably "success" in syncing nothing

            # 3. Upsert (Bulk)
            # SQLite upsert syntax
            stmt = insert(MarketData).values(records)
            stmt = stmt.on_conflict_do_update(
                index_elements=['ticker', 'date'],
                set_={
                    "open": stmt.excluded.open,
                    "high": stmt.excluded.high,
                    "low": stmt.excluded.low,
                    "close": stmt.excluded.close,
                    "volume": stmt.excluded.volume,
                    "last_updated": stmt.excluded.last_updated
                }
            )
            db.execute(stmt)
            db.commit()
            
            logger.info(f"Synced {len(records)} rows for {ticker}.")
            return True

        except Exception as e:
            logger.error(f"Sync failed for {ticker}: {e}")
            db.rollback()
            return False
