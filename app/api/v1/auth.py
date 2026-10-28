from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import ChangeCredentialsRequest, Token, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    # Check if user with same email exists
    result = await db.execute(select(User).where(User.email == user_in.email.lower()))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Don't allow arbitrary self-registration as ADMIN unless it's the very first user in the db
    role_to_assign = user_in.role
    if role_to_assign == UserRole.ADMIN:
        count_res = await db.execute(select(User))
        if len(count_res.scalars().all()) > 0:
            role_to_assign = UserRole.PARTICIPANT

    assigned_username = (
        user_in.username.lower().strip()
        if user_in.username
        else user_in.email.split("@")[0].lower()
    )

    user = User(
        email=user_in.email.lower(),
        username=assigned_username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=role_to_assign.value,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Login and receive a JWT Bearer token via username or email."""
    identifier = login_data.username.lower().strip()
    result = await db.execute(
        select(User).where(
            or_(
                User.username == identifier,
                User.email == identifier,
            )
        )
    )
    user = result.scalars().first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        expires_delta=access_token_expires,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """Fetch current user profile and role."""
    return current_user


@router.put("/credentials", response_model=UserResponse)
async def change_credentials(
    payload: ChangeCredentialsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update username and/or password for the authenticated user."""
    # Verify current password if user is changing password
    if payload.new_password:
        if payload.current_password:
            if not verify_password(payload.current_password, current_user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect.",
                )
        if len(payload.new_password.strip()) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 4 characters long.",
            )
        current_user.hashed_password = get_password_hash(payload.new_password.strip())

    if payload.new_username:
        new_username = payload.new_username.lower().strip()
        if new_username != (current_user.username or ""):
            # Check for conflict
            conflict = await db.execute(select(User).where(User.username == new_username))
            if conflict.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Username '{new_username}' is already taken.",
                )
            current_user.username = new_username

    await db.commit()
    await db.refresh(current_user)
    return current_user

