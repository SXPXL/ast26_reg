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
from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal, Base, engine
from app.models.user import User, UserRole

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
            # Ensure columns exist on database tables
            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);"))
                await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);"))
                await conn.execute(text("UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL;"))

                await conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time VARCHAR(50);"))
                await conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time VARCHAR(50);"))
                await conn.execute(text("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(30) DEFAULT 'ONLINE';"))
                await conn.execute(text("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS course_and_semester VARCHAR(100);"))
                await conn.execute(text("ALTER TABLE team_members ADD COLUMN IF NOT EXISTS course_and_semester VARCHAR(100);"))
            except Exception as col_err:
                logger.info(f"Column check notice: {col_err}")

        # Ensure admin user exists with username "admin" and password "1234"
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            admin_res = await db.execute(select(User).where(User.username == "admin"))
            admin = admin_res.scalars().first()
            if not admin:
                admin_res = await db.execute(select(User).where(User.email == "admin@fest.com"))
                admin = admin_res.scalars().first()

            hashed_pwd = get_password_hash("1234")
            if not admin:
                admin = User(
                    email="admin@fest.com",
                    username="admin",
                    hashed_password=hashed_pwd,
                    full_name="Fest Main Admin",
                    phone="9876543200",
                    role=UserRole.ADMIN.value,
                    is_active=True,
                )
                db.add(admin)
                await db.commit()
                logger.info("Default Admin seeded: username='admin', password='1234'")
            else:
                admin.username = "admin"
                admin.hashed_password = hashed_pwd
                admin.role = UserRole.ADMIN.value
                await db.commit()
                logger.info("Admin updated: username='admin', password='1234'")

        logger.info("Database tables, columns, and admin seeded successfully.")
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
