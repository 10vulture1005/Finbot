import sys
import os
import numpy as np
import pandas as pd
import logging
import unittest

# Ensure app is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.quant_engine.models import QuantModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestMLPipeline")

class TestMLPipeline(unittest.TestCase):
    
    def setUp(self):
        # Create synthetic data (3 years daily)
        dates = pd.date_range(start='2020-01-01', periods=800, freq='D')
        self.X = pd.DataFrame(index=dates)
        
        # Features
        self.X['Feature1'] = np.random.normal(0, 1, 800)
        self.X['Feature2'] = np.linspace(0, 10, 800) + np.random.normal(0, 0.5, 800)
        
        # Target (Linear relation to Feature2)
        self.y = 0.05 * self.X['Feature2'] + np.random.normal(0, 0.1, 800)
        self.y = pd.Series(self.y.values, index=dates)
        
    def test_xgb_regressor_training(self):
        """Test basic XGB Regressor training"""
        logger.info("Testing XGB Regressor Training...")
        model = QuantModel("xgb_regressor")
        model.train(self.X, self.y)
        
        preds = model.predict(self.X)
        self.assertEqual(len(preds), 800)
        
        # Check feature importance
        self.assertIsNotNone(model.feature_importance)
        self.assertTrue('Feature2' in model.feature_importance)
        logger.info(f"Feature Importance: {model.feature_importance}")
        
        # Expect Feature2 to be dominant
        imp = model.feature_importance
        self.assertGreater(imp['Feature2'], imp['Feature1'])

    def test_walk_forward_validation(self):
        """Test Walk-Forward Validation logic"""
        logger.info("Testing Walk-Forward Validation...")
        model = QuantModel("xgb_regressor")
        
        # Short windows for test speed
        metrics = model.train_walk_forward(self.X, self.y, train_window_days=300, test_window_days=50)
        
        self.assertGreater(len(metrics), 0)
        for m in metrics:
            logger.info(f"Window Metric: {m}")
            self.assertTrue(-1.0 <= m['IC'] <= 1.0)
            self.assertTrue(0.0 <= m['Directional_Accuracy'] <= 1.0)
            self.assertGreater(m['RMSE'], 0.0)

if __name__ == '__main__':
    unittest.main()
