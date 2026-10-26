from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user, require_volunteer_or_admin
from app.db.session import get_db
from app.models.event import Event, EventType, EventVolunteer
from app.models.payment import PaymentOrder, PaymentOrderStatus
from app.models.registration import AttendanceStatus, PaymentStatus, Registration
from app.models.team_member import TeamMember
from app.models.user import User, UserRole
from app.schemas.registration import (
    AttendanceUpdateRequest,
    RegistrationCreatedResponse,
    RegistrationCreate,
    RegistrationDetailResponse,
    RegistrationSummary,
)
from app.services.cashfree_service import cashfree_service
from app.services.registration_service import get_unique_registration_code

router = APIRouter(prefix="/registrations", tags=["Registrations"])


@router.post("", response_model=RegistrationCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_registration(
    reg_in: RegistrationCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a participant or team for an event.
    Validates capacity, deadline, team size constraints, and initializes payment.
    """
    # 1. Fetch and validate event
    result = await db.execute(select(Event).where(Event.id == reg_in.event_id))
    event = result.scalars().first()

    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or registration is closed.",
        )

    # Check deadline
    now_utc = datetime.now(timezone.utc)
    if event.registration_deadline and event.registration_deadline < now_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration deadline for this event has passed.",
        )

    # Check capacity
    if event.max_capacity:
        count_res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.event_id == event.id,
                Registration.payment_status == PaymentStatus.SUCCESS.value,
            )
        )
        current_confirmed = count_res.scalar() or 0
        if current_confirmed >= event.max_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event has reached maximum registration capacity.",
            )

    # 2. Validate Team Size & Rules
    total_participants = 1 + len(reg_in.team_members)  # Primary + Teammates

    if event.event_type == EventType.INDIVIDUAL.value:
        if len(reg_in.team_members) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This is an individual event; teammates cannot be added.",
            )
    elif event.event_type == EventType.TEAM.value:
        if total_participants < event.min_team_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team must have at least {event.min_team_size} members (including leader).",
            )
        if total_participants > event.max_team_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team cannot exceed {event.max_team_size} members (including leader).",
            )
        if not reg_in.team_name or not reg_in.team_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name is required for team events.",
            )

    # 3. Create Registration Record
    registration_code = await get_unique_registration_code(db)
    total_amount = event.registration_fee

    # If event is free, immediately mark as SUCCESS
    initial_payment_status = (
        PaymentStatus.SUCCESS.value
        if total_amount <= Decimal("0.00")
        else PaymentStatus.PENDING.value
    )

    registration = Registration(
        registration_code=registration_code,
        event_id=event.id,
        primary_name=reg_in.primary_name,
        primary_email=reg_in.primary_email.lower(),
        primary_phone=reg_in.primary_phone,
        college_name=reg_in.college_name,
        department=reg_in.department,
        year_of_study=reg_in.year_of_study,
        team_name=reg_in.team_name.strip() if reg_in.team_name else None,
        total_amount=total_amount,
        payment_status=initial_payment_status,
        attendance_status=AttendanceStatus.NOT_ATTENDED.value,
    )
    db.add(registration)
    await db.flush()  # Generates registration.id

    # 4. Add Team Members
    for member in reg_in.team_members:
        tm = TeamMember(
            registration_id=registration.id,
            full_name=member.full_name,
            email=member.email.lower(),
            phone=member.phone,
            college_name=member.college_name,
            roll_no=member.roll_no,
        )
        db.add(tm)

    # 5. Initialize Cashfree Payment Order if fee > 0
    payment_session_data = None
    if total_amount > Decimal("0.00"):
        cf_order_id = f"CF_{registration.registration_code.replace('-', '_')}_{int(datetime.now().timestamp())}"
        try:
            cf_response = await cashfree_service.create_order(
                order_id=cf_order_id,
                order_amount=float(total_amount),
                customer_id=registration.id,
                customer_name=reg_in.primary_name,
                customer_email=reg_in.primary_email,
                customer_phone=reg_in.primary_phone,
            )

            payment_order = PaymentOrder(
                registration_id=registration.id,
                cf_order_id=cf_order_id,
                order_amount=total_amount,
                order_currency="INR",
                payment_status=PaymentOrderStatus.ACTIVE.value,
                cf_payment_session_id=cf_response.get("payment_session_id"),
                gateway_response=cf_response,
            )
            db.add(payment_order)
            payment_session_data = cf_response
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Payment Gateway Error: {str(e)}",
            )

    await db.commit()
    await db.refresh(registration)

    return RegistrationCreatedResponse(
        registration_code=registration.registration_code,
        registration_id=str(registration.id),
        total_amount=registration.total_amount,
        payment_status=PaymentStatus(registration.payment_status),
        payment_session=payment_session_data,
    )


@router.get("/code/{registration_code}", response_model=RegistrationDetailResponse)
async def get_registration_by_code(
    registration_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Public lookup for participant ticket / registration pass by code."""
    query = (
        select(Registration)
        .where(Registration.registration_code == registration_code.upper().strip())
        .options(
            selectinload(Registration.event),
            selectinload(Registration.team_members),
            selectinload(Registration.marked_by_volunteer),
        )
    )
    result = await db.execute(query)
    reg = result.scalars().first()

    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found.",
        )

    res = RegistrationDetailResponse.model_validate(reg)
    res.event_title = reg.event.title if reg.event else None
    res.marked_by_name = reg.marked_by_volunteer.full_name if reg.marked_by_volunteer else None
    return res


@router.get("", response_model=List[RegistrationSummary])
async def list_registrations(
    event_id: Optional[str] = None,
    payment_status: Optional[PaymentStatus] = None,
    attendance_status: Optional[AttendanceStatus] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_volunteer_or_admin),
):
    """
    List registrations with filters.
    Admins see all; Volunteers only see registrations for their assigned events.
    """
    query = select(Registration).options(
        selectinload(Registration.event),
        selectinload(Registration.marked_by_volunteer),
    )

    # Scoping for volunteer role
    if current_user.role == UserRole.VOLUNTEER.value:
        assigned_events_res = await db.execute(
            select(EventVolunteer.event_id).where(EventVolunteer.user_id == current_user.id)
        )
        allowed_event_ids = assigned_events_res.scalars().all()
        if not allowed_event_ids:
            return []
        query = query.where(Registration.event_id.in_(allowed_event_ids))

    if event_id:
        query = query.where(Registration.event_id == event_id)
    if payment_status:
        query = query.where(Registration.payment_status == payment_status.value)
    if attendance_status:
        query = query.where(Registration.attendance_status == attendance_status.value)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Registration.registration_code.ilike(search_term),
                Registration.primary_name.ilike(search_term),
                Registration.primary_email.ilike(search_term),
                Registration.primary_phone.ilike(search_term),
                Registration.college_name.ilike(search_term),
                Registration.team_name.ilike(search_term),
            )
        )

    query = query.order_by(Registration.created_at.desc())
    result = await db.execute(query)
    registrations = result.scalars().all()

    response = []
    for reg in registrations:
        item = RegistrationSummary.model_validate(reg)
        item.event_title = reg.event.title if reg.event else None
        item.marked_by_name = reg.marked_by_volunteer.full_name if reg.marked_by_volunteer else None
        response.append(item)

    return response


@router.get("/{registration_id}", response_model=RegistrationDetailResponse)
async def get_registration(
    registration_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_volunteer_or_admin),
):
    """Get full registration details with team members."""
    query = (
        select(Registration)
        .where(Registration.id == registration_id)
        .options(
            selectinload(Registration.event),
            selectinload(Registration.team_members),
            selectinload(Registration.marked_by_volunteer),
        )
    )
    result = await db.execute(query)
    reg = result.scalars().first()

    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found.")

    # Authorization scope check for volunteers
    if current_user.role == UserRole.VOLUNTEER.value:
        assigned = await db.execute(
            select(EventVolunteer).where(
                EventVolunteer.event_id == reg.event_id,
                EventVolunteer.user_id == current_user.id,
            )
        )
        if not assigned.scalars().first():
            raise HTTPException(status_code=403, detail="Not authorized for this event.")

    res = RegistrationDetailResponse.model_validate(reg)
    res.event_title = reg.event.title if reg.event else None
    res.marked_by_name = reg.marked_by_volunteer.full_name if reg.marked_by_volunteer else None
    return res


@router.patch("/{registration_id}/attendance", response_model=RegistrationDetailResponse)
async def update_attendance(
    registration_id: str,
    update_in: AttendanceUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_volunteer_or_admin),
):
    """
    Mark participant/team as PRESENT (Check-in) or NOT_ATTENDED.
    Stores timestamp and volunteer ID who marked it.
    """
    query = (
        select(Registration)
        .where(Registration.id == registration_id)
        .options(
            selectinload(Registration.event),
            selectinload(Registration.team_members),
            selectinload(Registration.marked_by_volunteer),
        )
    )
    result = await db.execute(query)
    reg = result.scalars().first()

    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found.")

    # Check volunteer assignment
    if current_user.role == UserRole.VOLUNTEER.value:
        assigned = await db.execute(
            select(EventVolunteer).where(
                EventVolunteer.event_id == reg.event_id,
                EventVolunteer.user_id == current_user.id,
            )
        )
        if not assigned.scalars().first():
            raise HTTPException(status_code=403, detail="Not authorized to mark attendance for this event.")

    reg.attendance_status = update_in.attendance_status.value
    if update_in.attendance_status == AttendanceStatus.PRESENT:
        reg.attended_at = datetime.now(timezone.utc)
        reg.marked_by_volunteer_id = current_user.id if current_user.id != "00000000-0000-0000-0000-000000000001" else None
    else:
        reg.attended_at = None
        reg.marked_by_volunteer_id = None

    await db.commit()
    await db.refresh(reg)

    res = RegistrationDetailResponse.model_validate(reg)
    res.event_title = reg.event.title if reg.event else None
    res.marked_by_name = current_user.full_name
    return res
