from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import require_admin, require_authenticated
from app.db.session import get_db
from app.models.event import Event, EventType, EventVolunteer
from app.models.registration import PaymentStatus, Registration
from app.models.user import User, UserRole
from app.schemas.event import (
    AssignVolunteersRequest,
    EventCreate,
    EventDetailResponse,
    EventResponse,
    EventUpdate,
    VolunteerSimple,
)

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[EventResponse])
async def list_events(
    search: Optional[str] = None,
    event_type: Optional[EventType] = None,
    is_active: Optional[bool] = True,
    db: AsyncSession = Depends(get_db),
):
    """List all events with optional filters."""
    query = select(Event)

    if is_active is not None:
        query = query.where(Event.is_active == is_active)
    if event_type:
        query = query.where(Event.event_type == event_type.value)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Event.title.ilike(search_pattern))
            | (Event.description.ilike(search_pattern))
            | (Event.venue.ilike(search_pattern))
        )

    query = query.order_by(Event.event_date.asc())
    result = await db.execute(query)
    events = result.scalars().all()

    # Calculate total registrations count for each event
    response_items = []
    for ev in events:
        reg_count_res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.event_id == ev.id,
                Registration.payment_status == PaymentStatus.SUCCESS.value,
            )
        )
        total_regs = reg_count_res.scalar() or 0
        ev_data = EventResponse.model_validate(ev)
        ev_data.total_registrations = total_regs
        response_items.append(ev_data)

    return response_items


@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get single event details with assigned volunteers."""
    query = (
        select(Event)
        .where(Event.id == event_id)
        .options(
            selectinload(Event.volunteers).selectinload(EventVolunteer.user),
        )
    )
    result = await db.execute(query)
    event = result.scalars().first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    # Get confirmed registration count
    reg_count_res = await db.execute(
        select(func.count(Registration.id)).where(
            Registration.event_id == event.id,
            Registration.payment_status == PaymentStatus.SUCCESS.value,
        )
    )
    total_regs = reg_count_res.scalar() or 0

    volunteers_list = [
        VolunteerSimple(
            id=ev_vol.user.id,
            full_name=ev_vol.user.full_name,
            email=ev_vol.user.email,
            phone=ev_vol.user.phone,
        )
        for ev_vol in event.volunteers
        if ev_vol.user and ev_vol.user.is_active
    ]

    event_data = EventDetailResponse.model_validate(event)
    event_data.total_registrations = total_regs
    event_data.volunteers = volunteers_list
    return event_data


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Create a new fest event (Admin only)."""
    # Check if slug is unique
    existing_slug = await db.execute(select(Event).where(Event.slug == event_in.slug))
    if existing_slug.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An event with this URL slug already exists.",
        )

    event = Event(
        title=event_in.title,
        slug=event_in.slug,
        description=event_in.description,
        event_type=event_in.event_type.value,
        min_team_size=event_in.min_team_size,
        max_team_size=event_in.max_team_size,
        registration_fee=event_in.registration_fee,
        max_capacity=event_in.max_capacity,
        registration_deadline=event_in.registration_deadline,
        event_date=event_in.event_date,
        venue=event_in.venue,
        rules=event_in.rules,
        image_url=event_in.image_url,
        is_active=event_in.is_active,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    ev_data = EventResponse.model_validate(event)
    ev_data.total_registrations = 0
    return ev_data


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_in: EventUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Update event details (Admin only)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    # Check slug collision if slug changed
    if event_in.slug and event_in.slug != event.slug:
        existing_slug = await db.execute(select(Event).where(Event.slug == event_in.slug))
        if existing_slug.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An event with this URL slug already exists.",
            )

    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "event_type" and value is not None:
            setattr(event, field, value.value if hasattr(value, "value") else value)
        else:
            setattr(event, field, value)

    await db.commit()
    await db.refresh(event)

    ev_data = EventResponse.model_validate(event)
    return ev_data


@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
async def delete_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Deactivate or delete an event (Admin only)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    # Deactivate event
    event.is_active = False
    await db.commit()
    return {"message": "Event deactivated successfully."}


@router.post("/{event_id}/volunteers", status_code=status.HTTP_200_OK)
async def assign_volunteers(
    event_id: str,
    req: AssignVolunteersRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Assign one or more volunteers to an event (Admin only)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    for user_id in req.user_ids:
        # Check if user exists and is a volunteer
        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalars().first()
        if not user:
            continue
        
        # Check if already assigned
        existing = await db.execute(
            select(EventVolunteer).where(
                EventVolunteer.event_id == event_id,
                EventVolunteer.user_id == user_id,
            )
        )
        if not existing.scalars().first():
            ev_vol = EventVolunteer(event_id=event_id, user_id=user_id)
            db.add(ev_vol)

    await db.commit()
    return {"message": "Volunteers assigned successfully."}


@router.delete("/{event_id}/volunteers/{user_id}", status_code=status.HTTP_200_OK)
async def remove_volunteer_from_event(
    event_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Remove a volunteer from an event (Admin only)."""
    await db.execute(
        delete(EventVolunteer).where(
            EventVolunteer.event_id == event_id,
            EventVolunteer.user_id == user_id,
        )
    )
    await db.commit()
    return {"message": "Volunteer removed from event."}
