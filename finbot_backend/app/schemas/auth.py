from pydantic import BaseModel, EmailStr, Field


# ---------------------------
# Requests
# ---------------------------

class SignUpRequest(BaseModel):
    name:str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class SignUpVerifyRequest(BaseModel):
    user_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ---------------------------
# Responses
# ---------------------------

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
