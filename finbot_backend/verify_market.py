import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# 1. Sign Up (to get token if needed, or just rely on open endpoints if auth disabled/mocked)
# Assuming auth is needed, let's try to signup/signin or just check if endpoints are protected.
# Based on previous context, there is /auth/signup-init. 
# Let's assume we can just hit the market endpoints first as they might be public or we need a user.
# Actually, portfolio endpoints usually require a user.
# Let's try to create a user first.

def verify_market():
    print("Testing Search...")
    try:
        res = requests.get(f"{BASE_URL}/market/search?q=RELIANCE")
        print("Search Status:", res.status_code)
        print("Search Result:", res.json()[:2])
    except Exception as e:
        print("Search Failed:", e)

    print("\nTesting Fuzzy Search (RELIANVE)...")
    try:
        res = requests.get(f"{BASE_URL}/market/search?q=RELIANVE")
        print("Fuzzy Search Status:", res.status_code)
        print("Fuzzy Search Result:", res.json()[:2])
    except Exception as e:
        print("Fuzzy Search Failed:", e)

    print("\nTesting Quote...")
    try:
        res = requests.get(f"{BASE_URL}/market/quote/RELIANCE")
        print("Quote Status:", res.status_code)
        print("Quote Result:", res.json())
    except Exception as e:
        print("Quote Failed:", e)

if __name__ == "__main__":
    # Wait for server to start if running immediately after start command
    import time
    time.sleep(5)
    verify_market()
