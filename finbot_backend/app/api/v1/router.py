from fastapi import APIRouter
from app.api.v1 import auth,user,portfolio,chat,market,quant,alerts,swarm

router = APIRouter()

router.include_router(auth.router)
router.include_router(portfolio.router)
router.include_router(user.router)
router.include_router(chat.router, tags=["Chat"])
router.include_router(market.router)
router.include_router(quant.router)
router.include_router(alerts.router)
router.include_router(swarm.router)
