from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole

# HTTP Bearer authentication scheme (auto_error=False to allow custom REQ_AUTH handling)
security_scheme = HTTPBearer(auto_error=False)

# Mock user instance returned when REQ_AUTH is False and no token is provided
MOCK_ADMIN_USER = User(
    id="00000000-0000-0000-0000-000000000001",
    email="dev-admin@athra.local",
    hashed_password="",
    full_name="Developer Mock Admin",
    phone="9999999999",
    role=UserRole.ADMIN.value,
    is_active=True,
)


async def get_current_user(
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency to get the current authenticated user.
    If settings.REQ_AUTH is False and no valid token is provided, returns MOCK_ADMIN_USER.
    If settings.REQ_AUTH is True, strictly validates JWT token against the database.
    """
    # If auth is disabled and no credentials provided, bypass with mock user
    if not settings.REQ_AUTH and not auth_credentials:
        return MOCK_ADMIN_USER

    # If auth is required and no credentials provided
    if not auth_credentials:
        if not settings.REQ_AUTH:
            return MOCK_ADMIN_USER
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        if not settings.REQ_AUTH:
            return MOCK_ADMIN_USER
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        if not settings.REQ_AUTH:
            return MOCK_ADMIN_USER
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        if not settings.REQ_AUTH:
            return MOCK_ADMIN_USER
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user no longer exists.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    return user


class RoleChecker:
    """Dependency that ensures the authenticated user has one of the allowed roles."""

    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = [r.value if isinstance(r, UserRole) else r for r in allowed_roles]

    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
    ) -> User:
        if not settings.REQ_AUTH:
            return current_user

        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles [{', '.join(self.allowed_roles)}]",
            )
        return current_user


# Pre-configured role dependencies
require_admin = RoleChecker([UserRole.ADMIN])
require_volunteer_or_admin = RoleChecker([UserRole.ADMIN, UserRole.VOLUNTEER])
require_authenticated = RoleChecker([UserRole.ADMIN, UserRole.VOLUNTEER, UserRole.PARTICIPANT])
