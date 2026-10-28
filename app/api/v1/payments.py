import logging
from decimal import Decimal
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.payment import PaymentOrder, PaymentOrderStatus
from app.models.registration import PaymentStatus, Registration
from app.schemas.payment import VerifyPaymentRequest, VerifyPaymentResponse
from app.services.cashfree_service import cashfree_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(
    verify_req: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify payment status with Cashfree and update registration.
    Called when frontend returns from Cashfree checkout.
    """
    order_id = verify_req.order_id

    # 1. Fetch PaymentOrder from DB with eager loaded registration & event
    result = await db.execute(
        select(PaymentOrder)
        .where(PaymentOrder.cf_order_id == order_id)
        .options(
            selectinload(PaymentOrder.registration).selectinload(Registration.event)
        )
    )
    payment_order = result.scalars().first()

    if not payment_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment order not found.",
        )

    # 2. Fetch latest status from Cashfree
    try:
        cf_status = await cashfree_service.get_order_status(order_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error querying payment gateway: {str(e)}",
        )

    cf_order_status = cf_status.get("order_status", "ACTIVE").upper()
    payment_order.gateway_response = cf_status

    registration = payment_order.registration
    final_status = "PENDING"
    message = f"Payment is currently {cf_order_status}"
    success = False

    if cf_order_status == "PAID":
        payment_order.payment_status = PaymentOrderStatus.PAID.value
        if registration:
            registration.payment_status = PaymentStatus.SUCCESS.value
        message = "Payment verified successfully."
        final_status = "SUCCESS"
        success = True
    elif cf_order_status in ["EXPIRED", "TERMINATED", "CANCELLED"]:
        payment_order.payment_status = PaymentOrderStatus.EXPIRED.value
        if registration:
            registration.payment_status = PaymentStatus.FAILED.value
        message = f"Payment order is {cf_order_status.lower()}."
        final_status = "FAILED"
        success = False
    else:
        # Order is ACTIVE - check if any individual payment attempt occurred
        payments = await cashfree_service.get_order_payments(order_id)
        if payments:
            # Check for any successful attempt
            has_success = any(p.get("payment_status", "").upper() == "SUCCESS" for p in payments)
            if has_success:
                payment_order.payment_status = PaymentOrderStatus.PAID.value
                if registration:
                    registration.payment_status = PaymentStatus.SUCCESS.value
                message = "Payment verified successfully."
                final_status = "SUCCESS"
                success = True
            else:
                # Check the most recent attempt
                latest_p = payments[0]
                latest_st = latest_p.get("payment_status", "").upper()
                if latest_st in ["FAILED", "USER_DROPPED", "CANCELLED"]:
                    payment_order.payment_status = PaymentOrderStatus.FAILED.value
                    if registration:
                        registration.payment_status = PaymentStatus.FAILED.value
                    fail_msg = latest_p.get("payment_message") or f"Transaction was {latest_st.lower().replace('_', ' ')}."
                    message = fail_msg
                    final_status = "FAILED"
                    success = False
                elif latest_st in ["PENDING", "INITIALIZED"]:
                    final_status = "PENDING"
                    message = "Payment is processing at the bank..."
                    success = False
        else:
            final_status = "PENDING"
            message = "Payment awaiting completion at Cashfree."
            success = False

    await db.commit()

    event_title = registration.event.title if (registration and registration.event) else None
    participant_name = registration.primary_name if registration else None

    return VerifyPaymentResponse(
        success=success,
        message=message,
        order_id=order_id,
        registration_code=registration.registration_code if registration else None,
        payment_status=final_status,
        order_amount=payment_order.order_amount,
        event_title=event_title,
        participant_name=participant_name,
        raw_status=cf_order_status,
    )


@router.post("/webhook")
async def cashfree_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Webhook endpoint for Cashfree PG to receive asynchronous payment event notifications.
    """
    try:
        payload = await request.json()
        logger.info(f"Received Cashfree webhook: {payload}")

        event_type = payload.get("type")
        data = payload.get("data", {})
        order = data.get("order", {})
        order_id = order.get("order_id")

        if not order_id:
            return {"status": "ignored", "reason": "No order_id"}

        result = await db.execute(
            select(PaymentOrder)
            .where(PaymentOrder.cf_order_id == order_id)
            .options(selectinload(PaymentOrder.registration))
        )
        payment_order = result.scalars().first()

        if payment_order:
            payment_order.gateway_response = payload
            if event_type == "PAYMENT_SUCCESS_WEBHOOK":
                payment_order.payment_status = PaymentOrderStatus.PAID.value
                if payment_order.registration:
                    payment_order.registration.payment_status = PaymentStatus.SUCCESS.value
            elif event_type == "PAYMENT_FAILED_WEBHOOK":
                payment_order.payment_status = PaymentOrderStatus.FAILED.value
                if payment_order.registration:
                    payment_order.registration.payment_status = PaymentStatus.FAILED.value

            await db.commit()

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error handling webhook: {str(e)}")
        return {"status": "error", "detail": str(e)}
