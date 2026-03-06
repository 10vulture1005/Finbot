from app.db.session import SessionLocal
from app.models.user import User
from app.models.portfolio import PortfolioStock

db = SessionLocal()
user = db.query(User).first()
if user:
    print(f"User: {user.email}")
    holdings = db.query(PortfolioStock).filter_by(user_id=user.id).all()
    for h in holdings:
        print(f"  {h.symbol}: qty={h.quantity}, avg_price={h.avg_price}, target={h.weight_target}")
else:
    print("No user found")
