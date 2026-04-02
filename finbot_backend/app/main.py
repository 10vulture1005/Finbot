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
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://finbot-flame-gamma.vercel.app",
    ],
    allow_origin_regex=r"https://finbot-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# API routes
app.include_router(router, prefix="/api/v1")


@app.get("/")
def health_check():
    return {"status": "ok"}
