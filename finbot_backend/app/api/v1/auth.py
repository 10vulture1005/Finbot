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

@router.post("/signup-init")
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

        # order = create_order(amount=5000)

        return {
            "user_id": user.id,
            # "razorpay_order_id": order["id"],
            # "amount": order["amount"],
            # "currency": order["currency"],
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/signup-verify", response_model=TokenResponse)
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

        access_token = signin(
            db,
            user.email,
            data.get("password", ""),  
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed",
        )


@router.post("/signin", response_model=TokenResponse)
def signin_user(
    payload: SignInRequest,
    db: Session = Depends(get_db),
):
    print("login")

    try:
        token = signin(db, payload.email, payload.password)
        return {
            "access_token": token,
            "token_type": "bearer",
        }
    except ValueError:
        # throwing error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
