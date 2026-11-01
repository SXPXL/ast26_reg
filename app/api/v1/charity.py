from decimal import Decimal
import logging
import secrets
import string
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.charity import CharityDonation, CharityPaymentStatus
from app.services.cashfree_service import cashfree_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/charity", tags=["Charity"])


class CreateCharityDonationRequest(BaseModel):
    donor_name: str = Field(..., min_length=2, max_length=255)
    donor_email: EmailStr
    donor_phone: str = Field(..., min_length=10, max_length=15)
    amount: Decimal = Field(..., gt=0)


class VerifyCharityPaymentRequest(BaseModel):
    order_id: str


def generate_donation_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    clean_alphabet = "".join(c for c in alphabet if c not in "0O1I")
    random_str = "".join(secrets.choice(clean_alphabet) for _ in range(6))
    return f"CARE-{random_str}"


@router.post("/donate")
async def create_charity_donation(
    req: CreateCharityDonationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a dedicated charity donation and initiates Cashfree payment session.
    """
    donation_code = generate_donation_code()
    timestamp = int(datetime.now(timezone.utc).timestamp())
    cf_order_id = f"CF_CHARITY_{donation_code.replace('-', '_')}_{timestamp}"

    # Return URL directed back to /charity with order_id
    base_return = settings.CASHFREE_RETURN_URL.split("?")[0]
    return_url = base_return.replace("/payment/status", "/charity")
    if "{order_id}" not in return_url:
        return_url = f"{return_url}?order_id={cf_order_id}"
    else:
        return_url = return_url.replace("{order_id}", cf_order_id)

    try:
        cf_response = await cashfree_service.create_order(
            order_id=cf_order_id,
            order_amount=float(req.amount),
            customer_id=f"DONOR_{donation_code.replace('-', '')}",
            customer_name=req.donor_name.strip(),
            customer_email=req.donor_email.lower().strip(),
            customer_phone=req.donor_phone.strip(),
            return_url=return_url,
        )
    except Exception as exc:
        logger.error(f"Failed to create Cashfree order for charity donation: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment gateway error: {str(exc)}",
        )

    donation = CharityDonation(
        donation_code=donation_code,
        donor_name=req.donor_name.strip(),
        donor_email=req.donor_email.lower().strip(),
        donor_phone=req.donor_phone.strip(),
        amount=req.amount,
        cf_order_id=cf_order_id,
        cf_payment_session_id=cf_response.get("payment_session_id"),
        payment_status=CharityPaymentStatus.PENDING.value,
        gateway_response=cf_response,
    )
    db.add(donation)
    await db.commit()
    await db.refresh(donation)

    return {
        "success": True,
        "donation_code": donation.donation_code,
        "order_id": cf_order_id,
        "payment_session_id": cf_response.get("payment_session_id"),
        "amount": float(donation.amount),
        "donor_name": donation.donor_name,
        "environment": cf_response.get("environment", "sandbox"),
        "is_mock": cf_response.get("is_mock", False),
    }


@router.post("/verify")
async def verify_charity_donation(
    verify_req: VerifyCharityPaymentRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verifies Cashfree transaction for a charity donation.
    """
    order_id = verify_req.order_id
    result = await db.execute(
        select(CharityDonation).where(CharityDonation.cf_order_id == order_id)
    )
    donation = result.scalars().first()
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Charity donation record not found.",
        )

    # If already verified
    if donation.payment_status == CharityPaymentStatus.SUCCESS.value:
        return {
            "success": True,
            "status": "SUCCESS",
            "donation_code": donation.donation_code,
            "donor_name": donation.donor_name,
            "donor_email": donation.donor_email,
            "amount": float(donation.amount),
            "created_at": donation.created_at.isoformat(),
        }

    # Query Cashfree status
    try:
        cf_status = await cashfree_service.get_order_status(order_id)
    except Exception as e:
        logger.error(f"Error querying Cashfree for donation {order_id}: {e}")
        cf_status = {}

    order_status = str(cf_status.get("order_status", "")).upper()
    donation.gateway_response = cf_status

    if order_status == "PAID":
        donation.payment_status = CharityPaymentStatus.SUCCESS.value
        await db.commit()
        await db.refresh(donation)
        return {
            "success": True,
            "status": "SUCCESS",
            "donation_code": donation.donation_code,
            "donor_name": donation.donor_name,
            "donor_email": donation.donor_email,
            "amount": float(donation.amount),
            "created_at": donation.created_at.isoformat(),
        }

    # Check transactions list for this order
    try:
        payments = await cashfree_service.get_order_payments(order_id)
        if payments and any(p.get("payment_status", "").upper() == "SUCCESS" for p in payments):
            donation.payment_status = CharityPaymentStatus.SUCCESS.value
            await db.commit()
            await db.refresh(donation)
            return {
                "success": True,
                "status": "SUCCESS",
                "donation_code": donation.donation_code,
                "donor_name": donation.donor_name,
                "donor_email": donation.donor_email,
                "amount": float(donation.amount),
                "created_at": donation.created_at.isoformat(),
            }
    except Exception:
        pass

    if order_status in ["EXPIRED", "TERMINATED", "CANCELLED"]:
        donation.payment_status = CharityPaymentStatus.FAILED.value
        await db.commit()
        return {
            "success": False,
            "status": "FAILED",
            "donation_code": donation.donation_code,
            "message": f"Payment {order_status.lower()}",
        }

    return {
        "success": False,
        "status": "PENDING",
        "donation_code": donation.donation_code,
        "message": "Payment is awaiting confirmation.",
    }


@router.get("/code/{code}")
async def get_charity_donation_by_code(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Look up a charity donation by its unique CARE code or CF order id.
    """
    clean_code = code.strip()
    result = await db.execute(
        select(CharityDonation).where(
            (CharityDonation.donation_code == clean_code.upper()) |
            (CharityDonation.cf_order_id == clean_code)
        )
    )
    donation = result.scalars().first()
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation record not found",
        )

    return {
        "donation_code": donation.donation_code,
        "donor_name": donation.donor_name,
        "donor_email": donation.donor_email,
        "donor_phone": donation.donor_phone,
        "amount": float(donation.amount),
        "payment_status": donation.payment_status,
        "created_at": donation.created_at.isoformat(),
    }
