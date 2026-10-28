from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional
from pydantic import BaseModel
from app.models.payment import PaymentOrderStatus


class PaymentOrderCreate(BaseModel):
    registration_id: str


class PaymentOrderResponse(BaseModel):
    id: str
    registration_id: str
    cf_order_id: str
    cf_payment_id: Optional[str] = None
    order_amount: Decimal
    order_currency: str
    payment_status: PaymentOrderStatus
    cf_payment_session_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VerifyPaymentRequest(BaseModel):
    order_id: str


class VerifyPaymentResponse(BaseModel):
    success: bool
    message: str
    order_id: str
    registration_code: Optional[str] = None
    payment_status: str
    order_amount: Optional[Decimal] = None
    event_title: Optional[str] = None
    participant_name: Optional[str] = None
    raw_status: Optional[str] = None
