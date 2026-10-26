from fastapi import APIRouter
from app.api.v1.admin_stats import router as admin_stats_router
from app.api.v1.auth import router as auth_router
from app.api.v1.events import router as events_router
from app.api.v1.payments import router as payments_router
from app.api.v1.registrations import router as registrations_router
from app.api.v1.volunteers import router as volunteers_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(events_router)
api_router.include_router(volunteers_router)
api_router.include_router(registrations_router)
api_router.include_router(payments_router)
api_router.include_router(admin_stats_router)
