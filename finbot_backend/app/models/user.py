# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    name=Column(String ,default="User")
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)

    # Portfolio / Rebalancer Fields
    target_volatility = Column(Float, nullable=True)
    rebalance_frequency = Column(String, nullable=True) # monthly / quarterly
    rebalance_threshold = Column(Float, nullable=True)  # risk drift %
    last_rebalance_at = Column(DateTime, nullable=True)
    risk_model_version = Column(String, nullable=True)
