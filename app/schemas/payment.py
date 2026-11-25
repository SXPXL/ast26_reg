from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from app.models.payment import PaymentOrderStatus


class PaymentOrderCreate(BaseModel):
    registration_id: str


class PaymentOrderResponse(BaseModel):
    id: str
    registration_id: str
    payment_provider: Optional[str] = "razorpay"
    provider_order_id: Optional[str] = None
    provider_payment_id: Optional[str] = None
    # Backward compatibility
    cf_order_id: Optional[str] = None
    cf_payment_id: Optional[str] = None
    cf_payment_session_id: Optional[str] = None
    order_amount: Decimal
    order_currency: str
    payment_status: PaymentOrderStatus
    utr: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VerifyPaymentRequest(BaseModel):
    order_id: str
    # Razorpay client return payload
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    # Manual UPI submission
    utr: Optional[str] = None


class VerifyPaymentResponse(BaseModel):
    success: bool
    message: str
    order_id: str
    registration_code: Optional[str] = None
    payment_status: str
    payment_provider: Optional[str] = None
    payment_id: Optional[str] = None
    order_amount: Optional[Decimal] = None
    event_title: Optional[str] = None
    event_venue: Optional[str] = None
    venue: Optional[str] = None
    participant_name: Optional[str] = None
    raw_status: Optional[str] = None
    utr: Optional[str] = None


class ManualPaymentSubmitRequest(BaseModel):
    registration_code: str
    utr: str = Field(..., min_length=4, max_length=50, description="12-digit UPI UTR or bank transaction reference number")


class ManualPaymentReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    rejection_reason: Optional[str] = None
