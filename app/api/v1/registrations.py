from datetime import datetime, timezone
from decimal import Decimal
import logging
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)

from app.core.dependencies import get_current_user, get_current_user_optional, require_admin, require_volunteer_or_admin
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
from app.services.payments import get_active_provider_name, get_payment_provider, NormalizedPaymentStatus
from app.services.realtime import verify_payments_ws_manager
from app.services.registration_service import (
    assign_team_number_if_needed,
    get_unique_registration_code,
)

router = APIRouter(prefix="/registrations", tags=["Registrations"])


@router.post("", response_model=RegistrationCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_registration(
    reg_in: RegistrationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
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

    # Security check: Offline spot registration is strictly restricted to volunteers and admins
    is_offline = (reg_in.payment_mode or "").upper() == "OFFLINE"
    if is_offline and event.registration_fee > Decimal("0.00"):
        if not current_user or current_user.role not in [UserRole.ADMIN.value, UserRole.VOLUNTEER.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Offline spot registration is only permitted for authorized fest volunteers and administrators.",
            )

    # Registration is purely controlled by admin visibility (event.is_active)
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

    # 3. Validate Unique Email Per Event ("One email per event" rule)
    primary_email = reg_in.primary_email.strip().lower()
    teammate_emails = [m.email.strip().lower() for m in reg_in.team_members]

    # Check for duplicate emails within this incoming registration request
    if primary_email in teammate_emails:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The primary registrant email '{primary_email}' cannot also be added as a team member.",
        )

    seen_tm_emails = set()
    for tm_email in teammate_emails:
        if tm_email in seen_tm_emails:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate team member email '{tm_email}' found in registration.",
            )
        seen_tm_emails.add(tm_email)

    all_emails = [primary_email] + teammate_emails

    # Check if any incoming email has already been registered for this event as primary registrant
    existing_primary_res = await db.execute(
        select(Registration.primary_email)
        .where(
            Registration.event_id == event.id,
            func.lower(Registration.primary_email).in_(all_emails),
            Registration.payment_status == PaymentStatus.SUCCESS.value,
        )
    )
    conflict_primary = existing_primary_res.scalars().first()
    if conflict_primary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The email '{conflict_primary}' has already been registered for this event.",
        )

    # Check if any incoming email has already been registered for this event as a team member
    existing_member_res = await db.execute(
        select(TeamMember.email)
        .join(Registration, TeamMember.registration_id == Registration.id)
        .where(
            Registration.event_id == event.id,
            func.lower(TeamMember.email).in_(all_emails),
            Registration.payment_status == PaymentStatus.SUCCESS.value,
        )
    )
    conflict_member = existing_member_res.scalars().first()
    if conflict_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The email '{conflict_member}' has already been registered as a team member for this event.",
        )

    # D0. In manual desk mode, prevent duplicate PENDING_MANUAL registration for same email & event
    if get_active_provider_name() == "manual":
        existing_manual_res = await db.execute(
            select(Registration)
            .where(
                Registration.event_id == event.id,
                func.lower(Registration.primary_email).in_(all_emails),
                Registration.payment_status == PaymentStatus.PENDING_MANUAL.value,
            )
            .order_by(Registration.created_at.desc())
        )
        existing_manual = existing_manual_res.scalars().first()
        if existing_manual:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have already registered for this event (Code: {existing_manual.registration_code}). You can pay at the payment desk during the event day.",
            )

    # D. Check for existing PENDING registrations with 2-minute real-time Cashfree guard
    pending_regs_res = await db.execute(
        select(Registration)
        .where(
            Registration.event_id == event.id,
            func.lower(Registration.primary_email).in_(all_emails),
            Registration.payment_status == PaymentStatus.PENDING.value,
        )
        .order_by(Registration.created_at.desc())
    )
    pending_regs = pending_regs_res.scalars().all()

    pending_member_res = await db.execute(
        select(Registration)
        .join(TeamMember, TeamMember.registration_id == Registration.id)
        .where(
            Registration.event_id == event.id,
            func.lower(TeamMember.email).in_(all_emails),
            Registration.payment_status == PaymentStatus.PENDING.value,
        )
        .order_by(Registration.created_at.desc())
    )
    pending_member_regs = pending_member_res.scalars().all()

    # Combine unique pending registrations
    all_pending_dict = {r.id: r for r in (pending_regs + pending_member_regs)}
    now_utc = datetime.now(timezone.utc)

    for p_reg in all_pending_dict.values():
        created_time = p_reg.created_at
        if created_time.tzinfo is None:
            created_time = created_time.replace(tzinfo=timezone.utc)
        age_seconds = (now_utc - created_time).total_seconds()

        # Check latest status from active provider for the pending order
        order_res = await db.execute(
            select(PaymentOrder)
            .where(PaymentOrder.registration_id == p_reg.id)
            .order_by(PaymentOrder.created_at.desc())
        )
        p_order = order_res.scalars().first()

        lookup_id = p_order.provider_order_id or p_order.cf_order_id if p_order else None
        if p_order and lookup_id:
            try:
                provider = get_payment_provider(p_order.payment_provider)
                v_res = await provider.verify_payment(lookup_id, {})
                if v_res.status == NormalizedPaymentStatus.PAID:
                    p_order.payment_status = PaymentOrderStatus.PAID.value
                    p_order.provider_payment_id = v_res.payment_id or p_order.provider_payment_id
                    p_reg.payment_status = PaymentStatus.SUCCESS.value
                    await assign_team_number_if_needed(db, p_reg)
                    await db.commit()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Payment for '{p_reg.primary_email}' has already been received! Confirmed pass code: {p_reg.registration_code}.",
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.warning(f"Could not verify status for order {lookup_id}: {e}")

        # If order was created within the last 2 minutes (120 seconds), protect user from double charging
        if age_seconds < 120:
            remaining_secs = max(1, int(120 - age_seconds))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A payment attempt for '{p_reg.primary_email}' is currently in progress. If money was debited from your account, please wait and check your status. Otherwise, you can retry in {remaining_secs}s.",
            )
        else:
            # Older than 2 minutes: safely consider abandoned
            p_reg.payment_status = PaymentStatus.FAILED.value
            if p_order and p_order.payment_status == PaymentOrderStatus.ACTIVE.value:
                p_order.payment_status = PaymentOrderStatus.EXPIRED.value

    # 4. Create Registration Record
    registration_code = await get_unique_registration_code(db)
    total_amount = event.registration_fee

    assigned_team_name = None
    if event.event_type == EventType.TEAM.value:
        if reg_in.team_name and reg_in.team_name.strip():
            assigned_team_name = reg_in.team_name.strip()
        # Note: If no custom team name, auto 'Team N' will only be assigned once payment is SUCCESS!

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

    # If already SUCCESS (free / offline cash), assign team number now
    if initial_payment_status == PaymentStatus.SUCCESS.value:
        await assign_team_number_if_needed(db, registration)

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

    # 5. Initialize Payment Order if online and fee > 0
    payment_session_data = None
    if total_amount > Decimal("0.00") and not is_offline:
        provider = get_payment_provider()
        order_id = f"ATHRA_{registration.registration_code.replace('-', '_')}_{int(datetime.now().timestamp())}"
        try:
            order_result = await provider.create_order(
                order_id=order_id,
                amount=float(total_amount),
                customer_id=registration.id,
                customer_name=reg_in.primary_name,
                customer_email=reg_in.primary_email,
                customer_phone=reg_in.primary_phone,
                receipt=registration.registration_code,
            )

            payment_order = PaymentOrder(
                registration_id=registration.id,
                payment_provider=provider.provider_name,
                provider_order_id=order_result.order_id,
                cf_order_id=order_result.order_id,
                cf_payment_session_id=order_result.checkout_data.get("payment_session_id"),
                order_amount=total_amount,
                order_currency=order_result.currency,
                payment_status=order_result.status.value,
                gateway_response=order_result.raw_response,
            )
            registration.payment_provider = provider.provider_name
            registration.provider_order_id = order_result.order_id
            registration.payment_status = order_result.status.value
            db.add(payment_order)
            payment_session_data = {
                "provider": provider.provider_name,
                "order_id": order_result.order_id,
                **order_result.checkout_data,
            }
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Payment Gateway Error: {str(e)}",
            )

    await db.commit()
    await db.refresh(registration)

    # Broadcast newly registered participants (paid & free) to Verify Payments WebSocket clients
    await verify_payments_ws_manager.broadcast(
        "new_registration",
        {
            "id": str(registration.id),
            "registration_code": registration.registration_code,
            "primary_name": registration.primary_name,
            "primary_email": registration.primary_email,
            "primary_phone": registration.primary_phone,
            "college_name": registration.college_name,
            "event_id": str(registration.event_id),
            "event_title": event.title,
            "event_type": event.event_type,
            "total_amount": float(registration.total_amount or 0),
            "payment_status": registration.payment_status,
            "payment_provider": registration.payment_provider,
            "payment_mode": registration.payment_mode,
            "utr": registration.utr,
            "team_name": registration.team_name,
            "created_at": registration.created_at.isoformat() if registration.created_at else None,
            "paid_at": registration.paid_at.isoformat() if registration.paid_at else None,
        },
    )

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
    res.event_venue = reg.event.venue if reg.event else None
    res.venue = reg.event.venue if reg.event else None
    res.marked_by_name = reg.marked_by_volunteer.full_name if reg.marked_by_volunteer else None
    return res


@router.get("/by-email/{email}", response_model=List[RegistrationDetailResponse])
async def get_registrations_by_email(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """Public lookup for all registrations submitted under a participant email."""
    cleaned_email = email.lower().strip()
    query = (
        select(Registration)
        .where(
            or_(
                func.lower(Registration.primary_email) == cleaned_email,
                Registration.id.in_(
                    select(TeamMember.registration_id).where(func.lower(TeamMember.email) == cleaned_email)
                ),
            )
        )
        .options(
            selectinload(Registration.event),
            selectinload(Registration.team_members),
            selectinload(Registration.marked_by_volunteer),
        )
        .order_by(Registration.created_at.desc())
    )
    result = await db.execute(query)
    regs = result.scalars().all()

    items = []
    for reg in regs:
        res = RegistrationDetailResponse.model_validate(reg)
        res.event_title = reg.event.title if reg.event else None
        res.marked_by_name = reg.marked_by_volunteer.full_name if reg.marked_by_volunteer else None
        items.append(res)
    return items


@router.post("/{registration_id}/recheck-payment")
async def recheck_registration_payment(
    registration_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Recheck payment status with Cashfree for a specific registration.
    Updates the registration payment status to SUCCESS if verified as paid.
    """
    reg_res = await db.execute(
        select(Registration).where(Registration.id == registration_id).options(
            selectinload(Registration.event)
        )
    )
    reg = reg_res.scalars().first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration record not found.")

    if reg.payment_status == PaymentStatus.SUCCESS.value:
        return {
            "registration_id": reg.id,
            "payment_status": "SUCCESS",
            "message": "Payment is already confirmed.",
            "success": True,
        }

    # Find Cashfree PaymentOrder associated with this registration
    order_res = await db.execute(
        select(PaymentOrder)
        .where(PaymentOrder.registration_id == reg.id)
        .order_by(PaymentOrder.created_at.desc())
    )
    order = order_res.scalars().first()
    lookup_id = (order.provider_order_id or order.cf_order_id) if order else None
    if not order or not lookup_id:
        return {
            "registration_id": reg.id,
            "payment_status": reg.payment_status,
            "message": "No online payment order record found for this registration.",
            "success": False,
        }

    # Query gateway provider for latest status
    try:
        provider = get_payment_provider(order.payment_provider)
        v_res = await provider.verify_payment(lookup_id, {})

        if v_res.status == NormalizedPaymentStatus.PAID:
            order.payment_status = PaymentOrderStatus.PAID.value
            order.provider_payment_id = v_res.payment_id or order.provider_payment_id
            order.paid_at = datetime.now(timezone.utc)
            reg.payment_status = PaymentStatus.SUCCESS.value
            reg.provider_payment_id = v_res.payment_id or reg.provider_payment_id
            reg.paid_at = datetime.now(timezone.utc)
            await assign_team_number_if_needed(db, reg)
            await db.commit()
            return {
                "registration_id": reg.id,
                "payment_status": "SUCCESS",
                "message": "Payment verified successfully!",
                "success": True,
            }

        return {
            "registration_id": reg.id,
            "payment_status": reg.payment_status,
            "message": v_res.message or f"Payment status: {v_res.status.value}",
            "success": False,
        }
    except Exception as e:
        return {
            "registration_id": reg.id,
            "payment_status": reg.payment_status,
            "message": f"Payment check: {str(e)}",
            "success": False,
        }


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
        selectinload(Registration.team_members),
        selectinload(Registration.marked_by_volunteer),
    )

    # Scoping for volunteer role:
    # Volunteers have universal access to confirmed registrations across all events.
    if current_user.role == UserRole.VOLUNTEER.value:
        # Volunteers ONLY see confirmed paid registrations
        query = query.where(Registration.payment_status == PaymentStatus.SUCCESS.value)
    else:
        # Admin scoping:
        if payment_status:
            if payment_status.upper() != "ALL":
                query = query.where(Registration.payment_status == payment_status.upper())
        elif event_id:
            # If viewing a specific event check-in roster without explicit payment filter, default to SUCCESS
            query = query.where(Registration.payment_status == PaymentStatus.SUCCESS.value)

    if event_id and event_id.upper() != "ALL":
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
        item.event_venue = reg.event.venue if reg.event else None
        item.venue = reg.event.venue if reg.event else None
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

    res = RegistrationDetailResponse.model_validate(reg)
    res.event_title = reg.event.title if reg.event else None
    res.event_venue = reg.event.venue if reg.event else None
    res.venue = reg.event.venue if reg.event else None
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
    res.event_venue = reg.event.venue if reg.event else None
    res.venue = reg.event.venue if reg.event else None
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

