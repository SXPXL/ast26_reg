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
    result = await db.execute(select(User).where(User.email == volunteer_in.email.lower()))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    assigned_username = (
        volunteer_in.username.lower().strip()
        if volunteer_in.username
        else volunteer_in.email.split("@")[0].lower()
    )

    volunteer = User(
        email=volunteer_in.email.lower(),
        username=assigned_username,
        hashed_password=get_password_hash(volunteer_in.password),
        full_name=volunteer_in.full_name,
        phone=volunteer_in.phone,
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
    """List all registered volunteers and their assigned events (Admin only)."""
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
        
        vol_data = VolunteerWithEvents(
            id=str(vol.id),
            email=vol.email,
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
    """List all events assigned to the logged in volunteer/admin."""
    # If admin, return all events
    if current_user.role == UserRole.ADMIN.value:
        result = await db.execute(select(Event).where(Event.is_active == True))
        return result.scalars().all()

    # Otherwise return assigned events for volunteer
    query = (
        select(Event)
        .join(EventVolunteer, EventVolunteer.event_id == Event.id)
        .where(
            EventVolunteer.user_id == current_user.id,
            Event.is_active == True,
        )
    )
    result = await db.execute(query)
    return result.scalars().all()
