from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.auth import (
    SignUpRequest,
    SignInRequest,
    TokenResponse,
)
from app.services.auth_service import signup, signin, activate_user
from app.integrations.razorpay import (
    create_order,
    verify_payment_signature,
)
from app.db.session import get_db

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)

from app.core.security import create_access_token, create_refresh_token, decode_token
from app.services.auth_service import signup, signin, activate_user, get_user_by_email # make sure get_user_by_email is available or import User model
from app.models.user import User

from app.schemas.response import APIResponse

@router.post("/signup-init", response_model=APIResponse[dict])
def signup_init(
    payload: SignUpRequest,
    db: Session = Depends(get_db),
):
    try:
        user = signup(
            db,
            payload.name,
            payload.email,
            payload.password,
            is_active=True,
        )

        return APIResponse(
            success=True,
            data={"user_id": user.id},
            message="Signup successful. (Mock: Verification skipped for demo)"
        )

    except ValueError as e:
        # We can also return APIResponse with success=False instead of raising exception directly
        # But raising HTTPException is standard for 4xx in FastAPI.
        # To strictly follow "standardize response", we might want a global exception handler.
        # A simple approach is to let HTTPException bubble up for now, or wrap it.
        # User request says "Standardize responses: {success, ...}"
        # So we should probably try to return 200 OK with success=False for business errors?
        # Or 400 with the JSON body.
        # Best practice: 400 Bad Request with the Standard JSON body.
        # For this stage, let's keep raising HTTPException but we might need an exception handler later.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/signup-verify", response_model=APIResponse[TokenResponse])
def signup_verify(
    data: dict,
    db: Session = Depends(get_db),
):
    try:
        verify_payment_signature(
            data["razorpay_order_id"],
            data["razorpay_payment_id"],
            data["razorpay_signature"],
        )

        user = activate_user(db, user_id=data["user_id"])

        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        token_data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
        
        return APIResponse(success=True, data=token_data)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed",
        )


@router.post("/signin", response_model=APIResponse[TokenResponse])
def signin_user(
    payload: SignInRequest,
    db: Session = Depends(get_db),
):
    try:
        user = signin(db, payload.email, payload.password)
        
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        token_data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
        
        return APIResponse(success=True, data=token_data, message="Login successful")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

@router.post("/refresh", response_model=APIResponse[TokenResponse])
def refresh_token_endpoint(
    refresh_token: str,
    db: Session = Depends(get_db),
):
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
             raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        if not user_id:
             raise HTTPException(status_code=401, detail="Invalid token payload")
             
        new_access_token = create_access_token(data={"sub": user_id})
        new_refresh_token = create_refresh_token(data={"sub": user_id})
        
        token_data = {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
        
        return APIResponse(success=True, data=token_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
