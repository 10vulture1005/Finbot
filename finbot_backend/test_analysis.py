from app.db.session import SessionLocal
from app.models.user import User
from app.services.quant_service import QuantService
import json

db = SessionLocal()
user = db.query(User).filter_by(email="vaidiksaxena02@gmail.com").first()
if user:
    service = QuantService()
    result = service.run_analysis(db, user)
    print(json.dumps(result, indent=2))
else:
    print("No user found")
