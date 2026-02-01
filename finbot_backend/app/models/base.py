from sqlalchemy import Column, DateTime
from datetime import datetime
from app.db.base import Base


class BaseModel(Base):
    __abstract__ = True

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.now(),
        onupdate=datetime.now(),
    )
