import asyncio
from contextlib import asynccontextmanager
import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

# On Windows, psycopg async requires WindowsSelectorEventLoopPolicy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.api.router import api_router
from app.core.config import settings
from app.db.session import Base, engine

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("athra_fest")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to handle startup and shutdown."""
    logger.info("Starting up Athra Fest Backend API...")
    # Auto-create tables on startup and apply missing columns
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            # Ensure the username column exists on existing users table
            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);"))
                await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);"))
                await conn.execute(text("UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL;"))
            except Exception as col_err:
                logger.info(f"Column check notice: {col_err}")
        logger.info("Database tables and columns verified successfully.")
    except Exception as e:
        logger.warning(
            f"Database auto-creation warning (ensure PostgreSQL is running or run migrations): {e}"
        )
    yield
    logger.info("Shutting down Athra Fest Backend API...")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Athra Fest Registration, Cashfree PG, Volunteer Check-in, and Admin Analytics.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set up CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "req_auth_enabled": settings.REQ_AUTH,
    }


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)
