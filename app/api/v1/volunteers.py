from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import require_admin, require_volunteer_or_admin
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.event import Event, EventVolunteer
from app.models.user import User, UserRole
from app.schemas.auth import UserResponse, VolunteerCreate
from app.schemas.event import EventResponse

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


class VolunteerWithEvents(UserResponse):
    assigned_event_ids: List[str] = []
    assigned_events: List[str] = []


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_volunteer(
    volunteer_in: VolunteerCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Create a new volunteer user account (Admin only)."""
    email_clean = volunteer_in.email.lower().strip()
    result = await db.execute(select(User).where(User.email == email_clean))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    base_username = (
        volunteer_in.username.lower().strip()
        if (volunteer_in.username and volunteer_in.username.strip())
        else email_clean.split("@")[0]
    )
    assigned_username = base_username

    # Ensure username is unique
    existing_u = await db.execute(select(User).where(User.username == assigned_username))
    if existing_u.scalars().first():
        if volunteer_in.username and volunteer_in.username.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The username '{assigned_username}' is already in use. Please choose another username.",
            )
        import random
        assigned_username = f"{base_username}{random.randint(10, 99)}"

    raw_password = (volunteer_in.password or "").strip()
    if not raw_password or len(raw_password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long.",
        )

    volunteer = User(
        email=email_clean,
        username=assigned_username,
        hashed_password=get_password_hash(raw_password),
        full_name=volunteer_in.full_name.strip(),
        phone=volunteer_in.phone.strip() if volunteer_in.phone else None,
        role=UserRole.VOLUNTEER.value,
        is_active=True,
    )
    db.add(volunteer)
    await db.commit()
    await db.refresh(volunteer)
    return volunteer


@router.get("", response_model=List[VolunteerWithEvents])
async def list_volunteers(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List all registered volunteers (Admin only). Volunteers hold universal event permissions."""
    query = (
        select(User)
        .where(User.role == UserRole.VOLUNTEER.value)
        .options(
            selectinload(User.assigned_events).selectinload(EventVolunteer.event),
        )
        .order_by(User.created_at.desc())
    )
    result = await db.execute(query)
    volunteers = result.scalars().all()

    response = []
    for vol in volunteers:
        event_ids = [ev_vol.event_id for ev_vol in vol.assigned_events if ev_vol.event]
        event_names = [ev_vol.event.title for ev_vol in vol.assigned_events if ev_vol.event]
        if not event_names:
            event_names = ["All Events (Universal Access)"]

        vol_data = VolunteerWithEvents(
            id=str(vol.id),
            email=vol.email,
            username=vol.username,
            full_name=vol.full_name,
            phone=vol.phone,
            role=vol.role,
            is_active=vol.is_active,
            created_at=vol.created_at,
            assigned_event_ids=event_ids,
            assigned_events=event_names,
        )
        response.append(vol_data)

    return response


@router.get("/my-events", response_model=List[EventResponse])
async def get_my_assigned_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_volunteer_or_admin),
):
    """
    List all active events. Volunteers have universal access across all events
    to mark attendance and manually register participants.
    """
    result = await db.execute(
        select(Event)
        .where(Event.is_active == True)
        .order_by(Event.title.asc())
    )
    return result.scalars().all()
