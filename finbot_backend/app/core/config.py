from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    RAZORPAY_KEY_ID: str
    RAZORPAY_SECRET: str
    THESYS_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
