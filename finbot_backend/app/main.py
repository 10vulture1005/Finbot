from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.api.v1.router import router
from app.db.start import init_db
from fastapi.middleware.cors import CORSMiddleware




@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
  


app = FastAPI(
    title="AI SaaS Backend",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js / React
        "http://127.0.0.1:3000",
        "https://finbot-flame-gamma.vercel.app"
    ],
    allow_credentials=True,  # IMPORTANT (for cookies / auth)
    allow_methods=["*"],
    allow_headers=["*"],
)
# API routes
app.include_router(router, prefix="/api/v1")


@app.get("/")
def health_check():
    return {"status": "ok"}
