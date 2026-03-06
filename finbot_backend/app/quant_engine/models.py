import numpy as np
import pandas as pd
import joblib
import os
import logging

try:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
    from sklearn.model_selection import TimeSeriesSplit, cross_val_score
    from xgboost import XGBClassifier, XGBRegressor
    from sklearn.linear_model import LogisticRegression, Ridge
    from sklearn.naive_bayes import GaussianNB
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
except ImportError:
    pass

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
except ImportError:
    torch = None

logger = logging.getLogger(__name__)

class QuantModel:
    def __init__(self, model_type="combined"):
        self.model_type = model_type
        self.model = None
        self.nn_model = None
        self.feature_importance = None
        
    def train(self, X: pd.DataFrame, y: pd.Series):
        """
        Trains the selected model type.
        """
        logger.info(f"Training {self.model_type} model on {len(X)} samples...")
        
        if self.model_type == "rf":
            self.model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42, class_weight='balanced')
            self.model.fit(X, y)
            
        elif self.model_type == "xgb":
            self.model = XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.1, random_state=42, eval_metric='logloss')
            self.model.fit(X, y)
            
        elif self.model_type == "xgb_regressor":
            # Regression Model for Returns
            self.model = XGBRegressor(
                n_estimators=500, 
                max_depth=3, 
                learning_rate=0.05, 
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1, # L1
                reg_lambda=1.0, # L2
                random_state=42, 
                n_jobs=-1,
                objective='reg:squarederror',
                early_stopping_rounds=20
            )
            # Standard fit (no validation set passed here, usually done in walk_forward)
            self.model.fit(X, y, eval_set=[(X, y)], verbose=False)
            
            if hasattr(self.model, 'feature_importances_'):
                if hasattr(X, 'columns'):
                    self.feature_importance = dict(zip(X.columns, self.model.feature_importances_))
                else:
                    # X is likely numpy array (e.g. from PCA)
                    self.feature_importance = {f"Feature_{i}": imp for i, imp in enumerate(self.model.feature_importances_)}

        elif self.model_type == "stacked":
            # Diversity: RF, XGB, NB, KNN
            estimators = [
                ('rf', RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)),
                ('xgb', XGBClassifier(n_estimators=50, max_depth=3, eval_metric='logloss')),
                ('nb', GaussianNB()),
                ('knn', KNeighborsClassifier(n_neighbors=5))
            ]
            # Meta-learner: Logistic Regression
            self.model = VotingClassifier(estimators=estimators, voting='soft')
            self.model.fit(X, y)
            
        elif self.model_type == "nn":
            if torch is None:
                logger.warning("PyTorch not available. Fallback to RF.")
                self.model_type = "rf"
                self.train(X, y)
                return

            self._train_nn(X, y)
            
        elif self.model_type == "combined":
            # Train Stacked for ML part
            self.ml_model = QuantModel("stacked")
            self.ml_model.train(X, y)
            
            # Train NN for Deep Learning part
            if torch:
                self.nn_wrapper = QuantModel("nn")
                self.nn_wrapper.train(X, y)
            else:
                self.nn_wrapper = None
        
    def train_walk_forward(self, X: pd.DataFrame, y: pd.Series, train_window_days=730, test_window_days=180):
        """
        Implements Walk-Forward Validation (Rolling Window).
        
        Timeline:
        [ Train (2y) ][ Test (6m) ]
                     [ Train (2y) ][ Test (6m) ] ...
                     
        Args:
            X (pd.DataFrame): Features with DatetimeIndex
            y (pd.Series): Target with DatetimeIndex
        """
        if self.model_type != 'xgb_regressor':
            logger.warning("Walk-Forward implemented mainly for xgb_regressor.")
            
        dates = X.index.sort_values().unique()
        start_date = dates[0]
        end_date = dates[-1]
        
        current_date = start_date + pd.Timedelta(days=train_window_days)
        
        metrics = []
        
        while current_date < end_date:
            train_start = current_date - pd.Timedelta(days=train_window_days)
            test_end = current_date + pd.Timedelta(days=test_window_days)
            
            # Slice Data
            X_train = X.loc[train_start:current_date]
            y_train = y.loc[train_start:current_date]
            
            X_test = X.loc[current_date:test_end]
            y_test = y.loc[current_date:test_end]
            
            if len(X_test) < 10:
                break
                
            # Train
            model_instance = XGBRegressor(
                n_estimators=500, 
                max_depth=3, 
                learning_rate=0.05, 
                reg_lambda=1.0, 
                random_state=42, 
                n_jobs=-1,
                objective='reg:squarederror',
                early_stopping_rounds=20
            )
            
            model_instance.fit(
                X_train, y_train,
                eval_set=[(X_test, y_test)],
                verbose=False
            )
            
            # Evaluate
            preds = model_instance.predict(X_test)
            metrics_dict = self.calculate_metrics(y_test, preds)
            metrics_dict['date'] = current_date
            
            metrics.append(metrics_dict)
            
            logger.info(f"Walk-Forward {current_date.date()}: IC={metrics_dict['IC']:.4f}, DirAcc={metrics_dict['Directional_Accuracy']:.4f}")
            
            # Move forward
            current_date += pd.Timedelta(days=test_window_days)
            
        # Final Retrain on ALL data
        self.train(X, y)
        return metrics

    def calculate_metrics(self, y_true: pd.Series, y_pred: np.ndarray) -> dict:
        """
        Calculates Model Evaluation Metrics:
        - IC (Spearman Correlation)
        - RMSE
        - Directional Accuracy
        """
        y_true_vals = y_true.values
        
        # IC
        ic = pd.Series(y_pred).corr(pd.Series(y_true_vals), method='spearman')
        
        # RMSE
        rmse = np.sqrt(np.mean((y_pred - y_true_vals)**2))
        
        # Directional Accuracy (Sign match)
        # Avoid 0s issue by using sign
        correct_direction = np.sign(y_pred) == np.sign(y_true_vals)
        dir_acc = np.mean(correct_direction)
        
        return {
            "IC": ic,
            "RMSE": rmse,
            "Directional_Accuracy": dir_acc
        }

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Return raw regression predictions.
        """
        if self.model_type == "xgb_regressor":
            return self.model.predict(X)
        elif hasattr(self.model, "predict"):
            return self.model.predict(X)
        return np.zeros(len(X))

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Returns probability of Class 1 (Positive Return).
        """
        if self.model_type == "combined":
            p_ml = self.ml_model.predict_proba(X)
            if self.nn_wrapper:
                p_nn = self.nn_wrapper.predict_proba(X)
                return (p_ml + p_nn) / 2.0
            return p_ml

        if self.model_type == "nn":
            return self._predict_nn(X)
            
        if hasattr(self.model, "predict_proba"):
             # Return prob of class 1
             return self.model.predict_proba(X)[:, 1]
        
        return np.zeros(len(X))

    def _train_nn(self, X, y):
        # Convert to Tensor
        X_tensor = torch.FloatTensor(X.values)
        y_tensor = torch.FloatTensor(y.values).reshape(-1, 1)
        
        # Simple Feedforward NN
        input_dim = X.shape[1]
        self.nn_model = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )
        
        optimizer = optim.Adam(self.nn_model.parameters(), lr=0.001)
        criterion = nn.BCELoss()
        
        epochs = 50
        self.nn_model.train()
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = self.nn_model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()
            
    def _predict_nn(self, X):
        if not self.nn_model:
            return np.zeros(len(X))
            
        X_tensor = torch.FloatTensor(X.values)
        self.nn_model.eval()
        with torch.no_grad():
            outputs = self.nn_model(X_tensor)
        return outputs.numpy().flatten()
