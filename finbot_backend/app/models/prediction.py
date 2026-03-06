from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from app.models.base import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    prediction_date = Column(DateTime, index=True)  # When prediction was made
    target_date = Column(DateTime)                  # Horizon date (e.g., T+20)
    horizon_days = Column(Integer)                  # e.g., 20

    predicted_return = Column(Float)                # The ML output
    confidence_score = Column(Float, nullable=True) # Optional confidence/probability

    model_version = Column(String)                  # e.g., "xgb_v1"
    training_cutoff_date = Column(DateTime)         # Last data point used for training

    features_used = Column(JSON, nullable=True)     # Store feature values for audit
    metric_metadata = Column(JSON, nullable=True)   # Store local IC/Accuracy if available

    created_at = Column(DateTime, default=datetime.utcnow)
