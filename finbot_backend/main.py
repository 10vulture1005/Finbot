from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.api.v1.router import router
from app.db.start import init_db
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
  
# Vercel needs to find `app = FastAPI(...)` explicitly in the AST of the entrypoint file.
app = FastAPI(
    title="AI SaaS Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(router, prefix="/api/v1")

@app.get("/")
def health_check():
    return {"status": "ok", "build": "v3_regex_test", "root": True}
