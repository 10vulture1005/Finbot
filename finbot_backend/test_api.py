from datetime import timedelta
from app.core.security import create_access_token
from app.db.session import SessionLocal
from app.models.user import User
import requests

db = SessionLocal()
user = db.query(User).filter_by(email="vaidiksaxena02@gmail.com").first()
if user:
    token = create_access_token(data={"sub": str(user.id)}, expires_delta=timedelta(minutes=10))
    url = "http://localhost:8000/api/v1/quant/analyze"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(url, headers=headers)
    import json
    try:
        data = response.json()
        print(json.dumps(data.get("data", {}).get("details", []), indent=2))
    except Exception as e:
        print("Error parsing JSON:", e)
        print("Raw response:", response.text)
else:
    print("User not found.")
