from app.db.session import SessionLocal
from app.models.user import User
from app.services.risk_rebalancer_service import RiskRebalancerService
import json

db = SessionLocal()
user = db.query(User).filter_by(email="vaidiksaxena02@gmail.com").first()
if user:
    service = RiskRebalancerService(db, user)
    result = service.run_rebalance(mode="dry_run", reason="check_balance")
    print(json.dumps(result, indent=2))
else:
    print("No user found")
