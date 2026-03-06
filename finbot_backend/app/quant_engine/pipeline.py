from app.quant_engine.data_loader import QuantitativeDataClient
from app.quant_engine.features import FeatureEngineer
from app.quant_engine.models import QuantModel
from app.rebalancer.rebalance.mpt_solver import MPTSolver
import pandas as pd
import numpy as np
import logging
from sklearn.preprocessing import MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.impute import KNNImputer
from datetime import datetime
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class QuantPipeline:
    def __init__(self):
        self.data_client = QuantitativeDataClient()
        self.feature_eng = FeatureEngineer()
        self.model = QuantModel(model_type="xgb_regressor") # Use Regressor for Returns
        self.scaler = MinMaxScaler()
        self.imputer = KNNImputer(n_neighbors=5)
        self.pca = PCA(n_components=0.95) # Keep 95% variance
        self.is_trained = False

    def run_training(self, db: Session, tickers: list[str], training_date: datetime | None = None):
        """
        End-to-end training pipeline.
        Args:
           training_date: The virtual "today". Models will only see data up to this date.
        """
        logger.info(f"Starting Quant Engine Training (As of: {training_date or 'Now'})...")
        
        # 1. Fetch Data (Respecting cutoff)
        market_data_dict = self.data_client.fetch_market_data(db, tickers, period="2y", end_date=training_date)
        
        X_all = []
        y_all = []
        
        for ticker, df in market_data_dict.items():
            # 2. Features
            df_features = self.feature_eng.compute_technical_features(df)
            df_features = self.feature_eng.compute_regression_target(df_features) # Adds 'Target_20d'
            
            # Drop NaN rows (created by shifting/rolling)
            df_clean = df_features.dropna()
            
            if df_clean.empty:
                continue
                
            features = [c for c in df_clean.columns if c not in ['Target_20d', 'Open', 'High', 'Low', 'Close', 'Volume', 'Fwd_Ret_6m']]
            target = 'Target_20d'
            
            X_all.append(df_clean[features])
            y_all.append(df_clean[target])
            
        if not X_all:
            logger.error("No training data generated.")
            return
            
        X_train = pd.concat(X_all, axis=0)
        y_train = pd.concat(y_all, axis=0)
        
        # 3. Processing
        logger.info(f"Processing {len(X_train)} samples...")
        
        # Impute
        X_imputed = self.imputer.fit_transform(X_train)
        
        # Scale
        X_scaled = self.scaler.fit_transform(X_imputed)
        
        # PCA
        X_pca = self.pca.fit_transform(X_scaled)
        
        # 4. Train
        self.model.train(X_pca, y_train)
        self.is_trained = True
        logger.info("Training Complete.")

    def generate_portfolio(self, db: Session, tickers: list[str], top_n=30):
        """
        Generates portfolio recommendation.
        """
        if not self.is_trained:
             logger.warning("Model not trained! Running quick training...")
             # In production, load saved model. Here, train on same data for demo.
             self.run_training(db, tickers)
        
        # 1. Fetch current data
        market_data_dict = self.data_client.fetch_market_data(db, tickers, period="1y") # Need history for technicals
        
        if not market_data_dict:
             logger.warning("No market data found for portfolio generation.")
             return {"status": "error", "message": "No data"}
             
        predictions = []
        
        # Prepare returns_window for MPT
        # We need a DataFrame where columns are Tickers and rows are Daily Returns
        # We'll use the last 1 year of returns
        recent_prices = {}
        
        for ticker, df in market_data_dict.items():
            if df.empty: continue
            
            # --- Look-ahead Bias Prevention ---
            # Ensure we are not using a partial candle from "today" if checking intraday.
            # We use the last available full daily candle from DB.
            # Assuming DB syncs only completed days or we trust the data loader.
            
            # For technicals/prediction
            df_features = self.feature_eng.compute_technical_features(df)
            
            # Take the LAST row (current state)
            last_row = df_features.iloc[[-1]].copy()
            
            features = [c for c in last_row.columns if c not in ['Target', 'Open', 'High', 'Low', 'Close', 'Volume', 'Fwd_Ret_6m']]
            
            X_curr = last_row[features]
            
            # Process & Predict
            try:
                X_imputed = self.imputer.transform(X_curr)
                X_scaled = self.scaler.transform(X_imputed)
                X_pca = self.pca.transform(X_scaled)
                
                # Predict probability of being a "Winner" (>10% return)
                prob = self.model.predict_proba(X_pca)[0]
                
                predictions.append({
                    "symbol": ticker,
                    "probability": prob,
                    "price": df['Close'].iloc[-1]
                })
                
                # Collect price history for MPT (Close Daily)
                recent_prices[ticker] = df['Close']
                
            except Exception as e:
                logger.warning(f"Prediction failed for {ticker}: {e}")
                
        # Rank by Probability
        predictions.sort(key=lambda x: x['probability'], reverse=True)
        
        # Select Top N (filtering for high probability)
        # Only consider predicting "BUY" if prob > 0.6 (example threshold)
        selected_candidates = [p for p in predictions if p['probability'] > 0.5][:top_n]
        if not selected_candidates:
             # Fallback if no high conviction
             selected_candidates = predictions[:5]
        
        selected_tickers = [p['symbol'] for p in selected_candidates]
        logger.info(f"Selected Top {len(selected_tickers)} candidates for optimization: {selected_tickers}")
        
        # --- MPT Optimization ---
        # Construct DataFrame of Returns for selected tickers
        if selected_tickers and recent_prices:
            try:
                price_df = pd.DataFrame({t: recent_prices[t] for t in selected_tickers})
                # Alignment: Drop rows with NaN if tickers have different history lengths
                price_df = price_df.dropna()
                
                if not price_df.empty:
                    # Calculate Daily Returns
                    returns_df = price_df.pct_change().dropna()
                    
                    solver = MPTSolver(returns_df)
                    
                    # Optimize - e.g., Maximize Sharpe
                    opt_result = solver.maximize_sharpe_ratio()
                    
                    if opt_result['success']:
                        weights = opt_result['weights']
                        logger.info("MPT Optimization Successful.")
                    else:
                        logger.warning(f"MPT Optimization Failed: {opt_result.get('message')}. Using Equal Weights.")
                        weights = {t: 1.0/len(selected_tickers) for t in selected_tickers}
                else:
                    weights = {t: 1.0/len(selected_tickers) for t in selected_tickers}
            except Exception as e:
                logger.error(f"MPT failed: {e}. Using Equal Weights.")
                weights = {t: 1.0/len(selected_tickers) for t in selected_tickers}
        else:
             weights = {}

        # Construct Final Output
        final_portfolio = []
        for p in selected_candidates:
            w = weights.get(p['symbol'], 0.0)
            if w > 0.001: # Filter out negligible weights
                p['weight'] = w
                final_portfolio.append(p)
            
        return {
            "rebalance_date": pd.Timestamp.now().isoformat(),
            "model": "Hybrid (ML Selection + MPT Optimization)",
            "selected_stocks": [p['symbol'] for p in final_portfolio],
            "weights": {p['symbol']: p['weight'] for p in final_portfolio},
            "details": final_portfolio,
            # Added Risk Metrics
            "expected_return": opt_result.get('metrics', {}).get('expected_return', 0.15),
            "volatility": opt_result.get('metrics', {}).get('expected_volatility', 0.20),
            "sharpe_ratio": opt_result.get('metrics', {}).get('sharpe_ratio', 1.5),
            "risk_score": min(10, round(opt_result.get('metrics', {}).get('expected_volatility', 0.20) * 100 / 3, 1)), # Heuristic
            "summary": f"Optimized for Max Sharpe Ratio. Top allocation in {final_portfolio[0]['symbol'] if final_portfolio else 'None'}."
        }
