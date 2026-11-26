from datetime import datetime, timezone
from decimal import Decimal
import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.dependencies import require_volunteer_or_admin
from app.core.security import decode_access_token
from app.db.session import AsyncSessionLocal, get_db
from app.models.charity import CharityDonation, CharityPaymentStatus
from app.models.event import Event
from app.models.payment import PaymentOrder, PaymentOrderStatus
from app.models.registration import PaymentStatus, Registration
from app.models.user import User, UserRole
from app.schemas.payment import (
    ManualPaymentReviewRequest,
    ManualPaymentSubmitRequest,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
)
from app.services.payments.base import NormalizedPaymentStatus
from app.services.payments.factory import get_active_provider_name, get_payment_provider
from app.services.realtime import verify_payments_ws_manager
from app.services.registration_service import assign_team_number_if_needed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/config")
async def get_payment_config():
    """Public endpoint returning active payment mode/provider."""
    active_provider = get_active_provider_name()
    return {
        "payment_provider": active_provider,
        "manual_mode": active_provider == "manual",
    }


@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(
    verify_req: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Gateway-agnostic payment verification endpoint.
    Verifies payment with the active provider (Razorpay, Cashfree, or Manual UPI)
    and updates registration and payment order records.
    """
    order_id = verify_req.order_id or verify_req.razorpay_order_id
    if not order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order ID is required for verification.",
        )

    # 1. Fetch PaymentOrder from DB with eager loaded registration & event
    lookup_conditions = [
        PaymentOrder.provider_order_id == order_id,
        PaymentOrder.cf_order_id == order_id,
    ]
    if verify_req.razorpay_order_id:
        lookup_conditions.append(PaymentOrder.provider_order_id == verify_req.razorpay_order_id)
        lookup_conditions.append(PaymentOrder.cf_order_id == verify_req.razorpay_order_id)

    result = await db.execute(
        select(PaymentOrder)
        .where(or_(*lookup_conditions))
        .options(
            selectinload(PaymentOrder.registration).selectinload(Registration.event)
        )
    )
    payment_order = result.scalars().first()

    # If not found in payment_orders, check charity donations
    charity_donation = None
    if not payment_order:
        c_res = await db.execute(
            select(CharityDonation).where(
                or_(
                    CharityDonation.cf_order_id == order_id,
                    CharityDonation.id == order_id,
                )
            )
        )
        charity_donation = c_res.scalars().first()

    if not payment_order and not charity_donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment order not found.",
        )

    # 2. Resolve Provider
    provider_name = payment_order.payment_provider if payment_order else None
    provider = get_payment_provider(provider_name)

    # 3. Call Provider Verification
    verify_result = await provider.verify_payment(
        order_id=order_id,
        payload=verify_req.model_dump(),
        db_session=db,
    )

    now_utc = datetime.now(timezone.utc)
    final_status = "PENDING"
    success = False
    message = verify_result.message

    if payment_order:
        registration = payment_order.registration
        payment_order.gateway_response = verify_result.raw_response

        if verify_result.status == NormalizedPaymentStatus.PAID:
            payment_order.payment_status = PaymentOrderStatus.PAID.value
            payment_order.provider_payment_id = verify_result.payment_id or payment_order.provider_payment_id
            payment_order.paid_at = now_utc

            if registration:
                registration.payment_status = PaymentStatus.SUCCESS.value
                registration.provider_payment_id = verify_result.payment_id or registration.provider_payment_id
                registration.paid_at = now_utc
                await assign_team_number_if_needed(db, registration)

            final_status = "SUCCESS"
            success = True
            message = "Payment verified successfully."

        elif verify_result.status == NormalizedPaymentStatus.FAILED:
            payment_order.payment_status = PaymentOrderStatus.FAILED.value
            if registration:
                registration.payment_status = PaymentStatus.FAILED.value

            final_status = "FAILED"
            success = False

        elif verify_result.status == NormalizedPaymentStatus.PENDING_MANUAL:
            payment_order.payment_status = PaymentOrderStatus.PENDING_MANUAL.value
            if registration:
                registration.payment_status = PaymentStatus.PENDING_MANUAL.value

            final_status = "PENDING_MANUAL"
            success = False

        await db.commit()

        event_title = registration.event.title if (registration and registration.event) else None
        event_venue = registration.event.venue if (registration and registration.event) else None
        participant_name = registration.primary_name if registration else None

        return VerifyPaymentResponse(
            success=success,
            message=message,
            order_id=order_id,
            registration_code=registration.registration_code if registration else None,
            payment_status=final_status,
            payment_provider=provider.provider_name,
            payment_id=payment_order.provider_payment_id,
            order_amount=payment_order.order_amount,
            event_title=event_title,
            event_venue=event_venue,
            venue=event_venue,
            participant_name=participant_name,
            raw_status=verify_result.raw_status,
            utr=payment_order.utr,
        )

    else:
        # Charity donation verification
        if verify_result.status == NormalizedPaymentStatus.PAID:
            charity_donation.payment_status = CharityPaymentStatus.SUCCESS.value
            success = True
            final_status = "SUCCESS"
        elif verify_result.status == NormalizedPaymentStatus.FAILED:
            charity_donation.payment_status = CharityPaymentStatus.FAILED.value
            final_status = "FAILED"

        charity_donation.gateway_response = verify_result.raw_response
        await db.commit()

        return VerifyPaymentResponse(
            success=success,
            message=message,
            order_id=order_id,
            registration_code=charity_donation.donation_code,
            payment_status=final_status,
            payment_provider=provider.provider_name,
            order_amount=charity_donation.amount,
            participant_name=charity_donation.donor_name,
            raw_status=verify_result.raw_status,
        )


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Universal webhook endpoint supporting Razorpay, Cashfree, and any configured gateway.
    Automatically detects provider from webhook signature headers and verifies payload.
    Ensures idempotent processing to prevent duplicate confirmations.
    """
    try:
        raw_body = await request.body()
        headers = dict(request.headers)
        lower_headers = {k.lower(): v for k, v in headers.items()}

        # Auto-detect gateway provider from signature header
        if "x-razorpay-signature" in lower_headers:
            provider = get_payment_provider("razorpay")
        elif "x-webhook-signature" in lower_headers:
            provider = get_payment_provider("cashfree")
        else:
            provider = get_payment_provider()

        webhook_result = await provider.handle_webhook(raw_body, headers, db)
        if not webhook_result.handled:
            logger.warning(f"Rejected unhandled/invalid webhook from {provider.provider_name}: {webhook_result.message}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=webhook_result.message or "Invalid webhook signature.",
            )

        order_id = webhook_result.order_id
        if not order_id:
            return {"status": "ignored", "reason": "No order_id in webhook payload"}

        # 1. Fetch PaymentOrder
        res = await db.execute(
            select(PaymentOrder)
            .where(
                or_(
                    PaymentOrder.provider_order_id == order_id,
                    PaymentOrder.cf_order_id == order_id,
                )
            )
            .options(selectinload(PaymentOrder.registration))
        )
        payment_order = res.scalars().first()

        now_utc = datetime.now(timezone.utc)

        if payment_order:
            # Idempotency check: if already confirmed PAID, do not repeat
            if payment_order.payment_status == PaymentOrderStatus.PAID.value:
                logger.info(f"Webhook idempotency: Order {order_id} already marked PAID.")
                return {"status": "ok", "note": "already_paid"}

            payment_order.gateway_response = webhook_result.raw_payload

            if webhook_result.status == NormalizedPaymentStatus.PAID:
                payment_order.payment_status = PaymentOrderStatus.PAID.value
                payment_order.provider_payment_id = webhook_result.payment_id or payment_order.provider_payment_id
                payment_order.paid_at = now_utc

                if payment_order.registration:
                    payment_order.registration.payment_status = PaymentStatus.SUCCESS.value
                    payment_order.registration.provider_payment_id = webhook_result.payment_id or payment_order.registration.provider_payment_id
                    payment_order.registration.paid_at = now_utc
                    await assign_team_number_if_needed(db, payment_order.registration)

            elif webhook_result.status == NormalizedPaymentStatus.FAILED:
                payment_order.payment_status = PaymentOrderStatus.FAILED.value
                if payment_order.registration:
                    payment_order.registration.payment_status = PaymentStatus.FAILED.value

            await db.commit()
            return {"status": "ok"}

        # 2. Check CharityDonation
        c_res = await db.execute(
            select(CharityDonation).where(CharityDonation.cf_order_id == order_id)
        )
        donation = c_res.scalars().first()
        if donation:
            donation.gateway_response = webhook_result.raw_payload
            if webhook_result.status == NormalizedPaymentStatus.PAID:
                donation.payment_status = CharityPaymentStatus.SUCCESS.value
            elif webhook_result.status == NormalizedPaymentStatus.FAILED:
                donation.payment_status = CharityPaymentStatus.FAILED.value

            await db.commit()
            return {"status": "ok"}

        return {"status": "ignored", "reason": f"Order {order_id} not found in database"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling webhook: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.post("/manual-upi/submit")
async def submit_manual_upi_utr(
    req: ManualPaymentSubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Participant submission of 12-digit UTR/Transaction Reference ID
    for registrations under Manual UPI payment mode.
    Enforces UTR uniqueness across registrations to prevent reuse.
    """
    clean_utr = req.utr.strip().upper()
    code = req.registration_code.strip().upper()

    # Check for duplicate UTR reuse
    existing_utr_res = await db.execute(
        select(Registration).where(
            Registration.utr == clean_utr,
            Registration.registration_code != code,
        )
    )
    if existing_utr_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction reference (UTR) '{clean_utr}' has already been registered for another pass.",
        )

    # Fetch registration
    reg_res = await db.execute(
        select(Registration).where(Registration.registration_code == code)
    )
    reg = reg_res.scalars().first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found.",
        )

    if reg.payment_status == PaymentStatus.SUCCESS.value:
        return {
            "success": True,
            "message": "Registration is already verified and confirmed!",
            "payment_status": "SUCCESS",
        }

    # Update registration and payment order
    reg.utr = clean_utr
    reg.payment_status = PaymentStatus.PENDING_MANUAL.value

    order_res = await db.execute(
        select(PaymentOrder).where(PaymentOrder.registration_id == reg.id)
    )
    payment_order = order_res.scalars().first()
    if payment_order:
        payment_order.utr = clean_utr
        payment_order.payment_status = PaymentOrderStatus.PENDING_MANUAL.value

    await db.commit()

    return {
        "success": True,
        "message": "Transaction UTR submitted successfully! Fest coordinators will verify your payment.",
        "registration_code": reg.registration_code,
        "payment_status": "PENDING_MANUAL",
        "utr": clean_utr,
    }


@router.post("/manual-upi/review/{registration_id}")
async def review_manual_upi_payment(
    registration_id: str,
    review_req: ManualPaymentReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_volunteer_or_admin),
):
    """
    Admin / Volunteer endpoint to review and approve or reject Manual UPI payments.
    """
    res = await db.execute(
        select(Registration)
        .where(Registration.id == registration_id)
        .options(selectinload(Registration.payment_orders))
    )
    reg = res.scalars().first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found.",
        )

    now_utc = datetime.now(timezone.utc)
    if review_req.action == "approve":
        reg.payment_status = PaymentStatus.SUCCESS.value
        reg.paid_at = now_utc
        await assign_team_number_if_needed(db, reg)

        for p_order in reg.payment_orders:
            p_order.payment_status = PaymentOrderStatus.PAID.value
            p_order.paid_at = now_utc

        await db.commit()
        await verify_payments_ws_manager.broadcast(
            "payment_confirmed",
            {
                "id": str(reg.id),
                "registration_code": reg.registration_code,
                "payment_status": reg.payment_status,
                "paid_at": now_utc.isoformat(),
            },
        )
        return {
            "success": True,
            "message": f"Registration {reg.registration_code} payment APPROVED successfully.",
            "payment_status": "SUCCESS",
        }
    else:
        reg.payment_status = PaymentStatus.FAILED.value
        for p_order in reg.payment_orders:
            p_order.payment_status = PaymentOrderStatus.FAILED.value
            p_order.gateway_response = {"rejection_reason": review_req.rejection_reason}

        await db.commit()
        return {
            "success": True,
            "message": f"Registration {reg.registration_code} payment REJECTED.",
            "payment_status": "FAILED",
            "reason": review_req.rejection_reason,
        }


def _serialize_verify_payment_item(reg: Registration) -> Dict[str, Any]:
    return {
        "id": str(reg.id),
        "registration_code": reg.registration_code,
        "primary_name": reg.primary_name,
        "primary_email": reg.primary_email,
        "primary_phone": reg.primary_phone,
        "college_name": reg.college_name,
        "event_id": str(reg.event_id),
        "event_title": reg.event.title if reg.event else "Event",
        "event_type": reg.event.event_type if reg.event else "INDIVIDUAL",
        "total_amount": float(reg.total_amount or 0),
        "payment_status": reg.payment_status,
        "payment_provider": reg.payment_provider,
        "payment_mode": reg.payment_mode,
        "utr": reg.utr,
        "team_name": reg.team_name,
        "created_at": reg.created_at.isoformat() if reg.created_at else None,
        "paid_at": reg.paid_at.isoformat() if reg.paid_at else None,
    }


@router.get("/manual/list")
async def list_manual_payments(
    status_filter: str = Query("ALL", alias="status"),
    search: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_volunteer_or_admin),
):
    """
    List recently registered participants for the Verify Payments desk portal.
    Ordered by most recently registered first.
    """
    query = (
        select(Registration)
        .options(selectinload(Registration.event))
    )

    sf = (status_filter or "ALL").strip().upper()
    if sf == "PENDING":
        query = query.where(
            Registration.payment_status.in_(
                [PaymentStatus.PENDING.value, PaymentStatus.PENDING_MANUAL.value]
            )
        )
    elif sf in ("CONFIRMED", "SUCCESS", "PAID"):
        query = query.where(Registration.payment_status == PaymentStatus.SUCCESS.value)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.outerjoin(Event, Registration.event_id == Event.id).where(
            or_(
                Registration.primary_name.ilike(term),
                Registration.registration_code.ilike(term),
                Registration.primary_email.ilike(term),
                Registration.primary_phone.ilike(term),
                Registration.utr.ilike(term),
                Event.title.ilike(term),
            )
        )

    query = query.order_by(Registration.created_at.desc()).limit(limit)
    res = await db.execute(query)
    regs = res.scalars().all()
    return [_serialize_verify_payment_item(r) for r in regs]


@router.post("/manual/confirm/{registration_id}")
async def confirm_manual_desk_payment(
    registration_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_volunteer_or_admin),
):
    """
    Volunteer/Admin confirms that the participant has paid at the payment desk.
    Marks payment_status=SUCCESS, assigns team number if applicable, and broadcasts
    the confirmation via WebSocket to all connected Verify Payments clients.
    """
    res = await db.execute(
        select(Registration)
        .where(Registration.id == registration_id)
        .options(selectinload(Registration.payment_orders), selectinload(Registration.event))
    )
    reg = res.scalars().first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found.",
        )

    if reg.payment_status == PaymentStatus.SUCCESS.value:
        return {
            "success": True,
            "message": f"{reg.registration_code} is already confirmed.",
            "payment_status": "SUCCESS",
            "registration": _serialize_verify_payment_item(reg),
        }

    now_utc = datetime.now(timezone.utc)
    reg.payment_status = PaymentStatus.SUCCESS.value
    reg.paid_at = now_utc
    await assign_team_number_if_needed(db, reg)

    for p_order in reg.payment_orders:
        p_order.payment_status = PaymentOrderStatus.PAID.value
        p_order.paid_at = now_utc

    await db.commit()
    await db.refresh(reg)

    serialized = _serialize_verify_payment_item(reg)
    await verify_payments_ws_manager.broadcast("payment_confirmed", serialized)

    return {
        "success": True,
        "message": f"Payment confirmed for {reg.primary_name} ({reg.registration_code}).",
        "payment_status": "SUCCESS",
        "registration": serialized,
    }


@router.websocket("/ws/verify-payments")
async def verify_payments_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    Live WebSocket feed for the Verify Payments page.
    Pushes new registrations and payment confirmations in real time.
    """
    if settings.REQ_AUTH:
        if not token:
            await websocket.close(code=4401)
            return
        payload = decode_access_token(token)
        if not payload:
            await websocket.close(code=4401)
            return
        user_id = payload.get("sub")
        # Use a short-lived session for auth so no DB connection is held open during the WebSocket lifetime
        async with AsyncSessionLocal() as db:
            user_res = await db.execute(select(User).where(User.id == user_id))
            user = user_res.scalars().first()
        if not user or not user.is_active or user.role not in [UserRole.ADMIN.value, UserRole.VOLUNTEER.value]:
            await websocket.close(code=4403)
            return

    await verify_payments_ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; ignore client messages or respond to ping
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text('{"event":"pong"}')
    except WebSocketDisconnect:
        await verify_payments_ws_manager.disconnect(websocket)
    except Exception:
        await verify_payments_ws_manager.disconnect(websocket)
