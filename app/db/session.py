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
    port = parsed.port or 5432
    connect_args["timeout"] = 15

    # If connecting to an external cloud database (e.g. Neon PostgreSQL)
    if host and not host.startswith("localhost") and not host.startswith("127."):
        try:
            # Force IPv4 resolution to bypass hangs on Windows/networks with unroutable IPv6
            ipv4_info = socket.getaddrinfo(host, port, socket.AF_INET)
            if ipv4_info:
                ipv4_host = ipv4_info[0][4][0]
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                connect_args["ssl"] = ctx

                # Neon pooler endpoint option if connecting to *.neon.tech
                if "neon.tech" in host:
                    endpoint = host.split(".")[0].replace("-pooler", "")
                    connect_args["server_settings"] = {"options": f"endpoint={endpoint}"}

                user_part = f"{parsed.username}:{parsed.password}@" if parsed.username else ""
                netloc = f"{user_part}{ipv4_host}:{port}"
                url = urlunparse((scheme, netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
                return url, connect_args
        except Exception:
            pass

    url = urlunparse((scheme, parsed.netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
    return url, connect_args


from sqlalchemy.pool import NullPool

_url, _connect_args = _get_engine_config()

engine = create_async_engine(
    _url,
    poolclass=NullPool,
    echo=settings.DEBUG,
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
