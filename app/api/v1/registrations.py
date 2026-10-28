from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user, require_admin, require_volunteer_or_admin
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
    # 3. Create Registration Record
    registration_code = await get_unique_registration_code(db)
    total_amount = event.registration_fee
    is_offline = (reg_in.payment_mode or "").upper() == "OFFLINE"

    assigned_team_name = None
    if event.event_type == EventType.TEAM.value:
        if reg_in.team_name and reg_in.team_name.strip():
            assigned_team_name = reg_in.team_name.strip()
        else:
            # Assign team number in order of registration starting from 1
            count_res = await db.execute(
                select(func.count(Registration.id)).where(Registration.event_id == event.id)
            )
            existing_team_count = count_res.scalar() or 0
            assigned_team_name = f"Team {existing_team_count + 1}"

    # If event is free or paid offline cash, immediately mark as SUCCESS
    initial_payment_status = (
        PaymentStatus.SUCCESS.value
        if (total_amount <= Decimal("0.00") or is_offline)
        else PaymentStatus.PENDING.value
    )

    registration = Registration(
        registration_code=registration_code,
        event_id=event.id,
        primary_name=reg_in.primary_name,
        primary_email=reg_in.primary_email.lower(),
        primary_phone=reg_in.primary_phone,
        college_name=reg_in.college_name,
        department=reg_in.department or "General",
        year_of_study=reg_in.year_of_study or "1st Year",
        course_and_semester=reg_in.course_and_semester,
        team_name=assigned_team_name,
        total_amount=total_amount,
        payment_mode="OFFLINE" if is_offline else "ONLINE",
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
            department=member.department,
            course_and_semester=member.course_and_semester,
            roll_no=member.roll_no,
        )
        db.add(tm)

    # 5. Initialize Cashfree Payment Order if online and fee > 0
    payment_session_data = None
    if total_amount > Decimal("0.00") and not is_offline:
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
        payment_mode=registration.payment_mode,
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
    payment_status: Optional[str] = None,
    attendance_status: Optional[AttendanceStatus] = None,
    payment_mode: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_volunteer_or_admin),
):
    """
    List registrations with filters.
    Admins see all (with optional payment status filter); Volunteers ONLY see confirmed paid registrations.
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
        # Volunteers MUST NEVER see unpaid / pending registrations
        query = query.where(Registration.payment_status == PaymentStatus.SUCCESS.value)
    else:
        # Admin scoping:
        if payment_status:
            if payment_status.upper() != "ALL":
                query = query.where(Registration.payment_status == payment_status.upper())
        elif event_id:
            # If viewing a specific event check-in roster without explicit payment filter, default to SUCCESS
            query = query.where(Registration.payment_status == PaymentStatus.SUCCESS.value)

    if event_id:
        query = query.where(Registration.event_id == event_id)
    if payment_mode and payment_mode.upper() != "ALL":
        query = query.where(Registration.payment_mode == payment_mode.upper())
    if attendance_status:
        query = query.where(Registration.attendance_status == attendance_status.value)
    else:
        # When all is selected, hidden shouldn't be shown
        query = query.where(Registration.attendance_status != "HIDDEN")
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

    # Prevent marking attendance if registration has not been paid
    if update_in.attendance_status == AttendanceStatus.PRESENT and reg.payment_status != PaymentStatus.SUCCESS.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check in participant: Payment has not been completed.",
        )

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


@router.delete("/{registration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_registration(
    registration_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Permanently delete a registration (Admin only)."""
    reg = await db.get(Registration, registration_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found.")

    # Delete related team members
    await db.execute(delete(TeamMember).where(TeamMember.registration_id == registration_id))
    await db.delete(reg)
    await db.commit()
    return None

