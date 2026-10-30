import socket
import ssl
from typing import AsyncGenerator
from urllib.parse import urlparse, urlunparse
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from app.core.config import settings


def _get_engine_config():
    raw_url = settings.DATABASE_URL
    connect_args = {}

    if raw_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        return raw_url, connect_args

    parsed = urlparse(raw_url)
    scheme = parsed.scheme
    if scheme in ("postgresql", "postgres"):
        scheme = "postgresql+asyncpg"

    host = parsed.hostname
    connect_args["timeout"] = 15

    # Filter out query parameters unsupported by asyncpg (like sslmode, channel_binding)
    clean_query = ""
    if parsed.query:
        valid_queries = [
            q for q in parsed.query.split("&")
            if q and not any(q.startswith(unsupported) for unsupported in ("sslmode=", "channel_binding="))
        ]
        clean_query = "&".join(valid_queries)

    # If connecting to an external cloud database (e.g. Neon PostgreSQL)
    if host and not host.startswith("localhost") and not host.startswith("127."):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ctx

    url = urlunparse((scheme, parsed.netloc, parsed.path, parsed.params, clean_query, parsed.fragment))
    return url, connect_args


from sqlalchemy.pool import NullPool
import logging

# Suppress verbose SQL queries, pool transactions, and rollbacks from terminal logs
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)

_url, _connect_args = _get_engine_config()

engine = create_async_engine(
    _url,
    poolclass=NullPool,
    echo=False,
    future=True,
    connect_args=_connect_args,
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
