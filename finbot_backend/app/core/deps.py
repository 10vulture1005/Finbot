from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status, Header
from app.db.session import get_db
from app.models.user import User
from app.core.config import settings

# ✅ This extracts token from Authorization: Bearer <token>
def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization:
        print("DEBUG: Authorization header missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    # Expect: "Bearer <token>"
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            print(f"DEBUG: Invalid scheme {scheme}")
            raise ValueError()
    except ValueError:
        print("DEBUG: ValueError splitting header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id = int(payload.get("sub"))
        print(f"DEBUG: Token decoded for user_id: {user_id}")
    except (JWTError, TypeError, ValueError) as e:
        print(f"DEBUG: Token decode error: {e}")
        # Hint for expiration
        if "ExpiredSignatureError" in str(e):
             print("DEBUG: Token has EXPIRED.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"DEBUG: User {user_id} not found in DB")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user
