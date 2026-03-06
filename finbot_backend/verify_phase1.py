import sys
import os
import time
import requests
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add app to path
sys.path.append(os.getcwd())

from app.main import app
from app.db.base import Base
from app.core.config import settings

# Setup Test Client
client = TestClient(app)

def test_auth_flow():
    print("Testing Auth Flow...")
    email = f"test_user_{int(time.time())}@example.com"
    password = "securepassword123"
    name = "Test User"

    # 1. Signup Init
    response = client.post("/api/v1/auth/signup-init", json={
        "name": name,
        "email": email,
        "password": password
    })
    if response.status_code != 200:
        print(f"FAILED: Signup Init {response.text}")
        return
    user_id = response.json()["user_id"]
    print(f"  [OK] Signup Init (User ID: {user_id})")

    # 2. Signup Verify (Mocking Razorpay)
    # We need to mock the verification or use a known signature if the backend validates it strictly.
    # Looking at auth.py, it calls verify_payment_signature.
    # We might need to mock this or ensure we pass valid-ish data if it's just a checksum.
    # For now, let's try to Signin directly if the user was created but not active?
    # No, user is not active until verify.
    # Let's mock the verify_payment_signature in the app? 
    # Or just try to hit signin and see if we can authenticate generic users?
    # Ideally we should have a test mode.
    
    # 3. Signin (Let's assume we have a pre-existing user or we just test the endpoint structure)
    # Since we can't easily mock the razorpay signature without the secret, let's test failure cases or structure.
    
    response = client.post("/api/v1/auth/signin", json={
        "email": email,
        "password": password
    })
    
    # It might fail with "Invalid email or password" or "User inactive" which confirms the endpoint works.
    print(f"  [INFO] Signin Response: {response.status_code} {response.json()}")

    # Let's try to hit the Refresh endpoint with a dummy token to see validation
    response = client.post("/api/v1/auth/refresh?refresh_token=invalid_token")
    if response.status_code == 401:
        print("  [OK] Refresh Token Validation (Correctly rejected invalid token)")
    else:
        print(f"FAILED: Refresh Token Validation {response.status_code}")

def test_quant_async():
    print("\nTesting Quant Async Endpoints...")
    # We need a token to hit these endpoints usually. 
    # Let's see if we can bypass auth for testing or if we need to mock `get_current_user`.
    # app.dependency_overrides can be used.
    
    from app.core.deps import get_current_user
    from app.models.user import User

    # Mock User
    def mock_get_current_user():
        return User(id=1, email="mock@example.com", is_active=True)

    app.dependency_overrides[get_current_user] = mock_get_current_user

    # 1. Analyze
    response = client.post("/api/v1/quant/analyze")
    if response.status_code == 200:
        data = response.json()
        if data.get("status") == "accepted":
            print("  [OK] Quant Analyze (Async returned immediately)")
        else:
            print(f"FAILED: Quant Analyze status {data}")
    else:
        print(f"FAILED: Quant Analyze {response.status_code} {response.text}")

    # 2. Rebalance
    response = client.post("/api/v1/quant/rebalance", json={"target_weights": {"AAPL": 0.5}})
    if response.status_code == 200:
        data = response.json()
        if data.get("status") == "accepted":
            print("  [OK] Quant Rebalance (Async returned immediately)")
        else:
            print(f"FAILED: Quant Rebalance status {data}")
    else:
        print(f"FAILED: Quant Rebalance {response.status_code} {response.text}")

    # Clean up
    app.dependency_overrides = {}

if __name__ == "__main__":
    try:
        test_auth_flow()
        test_quant_async()
        print("\nVerification Complete.")
    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
