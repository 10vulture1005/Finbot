from app.db.base import Base
from app.db.session import engine


from app.models.user import User
from app.models.portfolio import PortfolioStock
from app.models.market_data import MarketData
from app.models.portfolio_history import PortfolioHistory
from app.models.prediction import Prediction
def init_db():
    """
    Initialize database tables.
    DEV ONLY – use Alembic in production.
    """
    Base.metadata.create_all(bind=engine)
