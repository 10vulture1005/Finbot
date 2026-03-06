import os
import sys

# Add backend directory to sys path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.portfolio import PortfolioStock
from app.services.risk_rebalancer_service import RiskRebalancerService
import json

def test():
    db = SessionLocal()
    user = db.query(User).first()
    if not user:
        print("No user found in DB.")
        return
        
    holdings = db.query(PortfolioStock).filter_by(user_id=user.id).all()
    if not holdings:
        print(f"User {user.email} has no holdings. Finding another user...")
        # try another user
        users = db.query(User).all()
        for u in users:
            if db.query(PortfolioStock).filter_by(user_id=u.id).first():
                user = u
                break
                
    print(f"=== Testing RiskRebalancerService for User: {user.email} ===")
    
    service = RiskRebalancerService(db, user)
    result = service.run_rebalance(mode="dry_run", reason="manual")
    
    print(json.dumps(result, indent=2))
    
if __name__ == "__main__":
    test()
