from app.db.base import Base
from app.db.session import engine


from app.models.user import User


def init_db():
    """
    Initialize database tables.
    DEV ONLY – use Alembic in production.
    """
    Base.metadata.create_all(bind=engine)
