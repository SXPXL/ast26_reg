import uuid
from typing import Any, Dict, Optional

from app.services.payments.base import (
    NormalizedPaymentStatus,
    PaymentOrderResult,
    PaymentProvider,
    PaymentVerificationResult,
    WebhookResult,
)


class ManualDeskProvider(PaymentProvider):
    """
    Manual Pay-at-Desk Payment Provider (when PAYMENT_PROVIDER=manual).
    - No online payments are allowed or initiated.
    - Participant registers normally and is told to pay at the payment desk on event day.
    - Registration starts as PENDING_MANUAL.
    - Volunteers/Admins confirm payment at the desk via the Verify Payments portal.
    """

    @property
    def provider_name(self) -> str:
        return "manual"

    async def create_order(
        self,
        order_id: str,
        amount: float,
        customer_id: str,
        customer_name: str,
        customer_email: str,
        customer_phone: str,
        receipt: str,
        return_url: Optional[str] = None,
        notes: Optional[Dict[str, str]] = None,
    ) -> PaymentOrderResult:
        desk_order_id = f"DESK_{receipt or uuid.uuid4().hex[:10]}"

        return PaymentOrderResult(
            provider=self.provider_name,
            order_id=desk_order_id,
            amount=amount,
            currency="INR",
            status=NormalizedPaymentStatus.PENDING_MANUAL,
            checkout_data={
                "provider": "manual",
                "order_id": desk_order_id,
                "is_manual_desk": True,
                "message": "You can pay at the payment desk during the event day.",
            },
            raw_response={
                "provider": "manual",
                "order_id": desk_order_id,
                "amount": amount,
                "mode": "PAY_AT_DESK",
            },
        )

    async def verify_payment(
        self,
        order_id: str,
        payload: Optional[Dict[str, Any]] = None,
        db_session: Any = None,
    ) -> PaymentVerificationResult:
        return PaymentVerificationResult(
            success=False,
            status=NormalizedPaymentStatus.PENDING_MANUAL,
            message="Payment pending at the event payment desk.",
            provider=self.provider_name,
            order_id=order_id,
            raw_status="PENDING_MANUAL",
            raw_response=payload or {},
        )

    async def get_order_status(self, order_id: str) -> PaymentVerificationResult:
        return await self.verify_payment(order_id)

    async def handle_webhook(
        self,
        raw_body: bytes,
        headers: Dict[str, str],
    ) -> WebhookResult:
        return WebhookResult(
            handled=False,
            message="Webhooks from external gateways are not used in manual desk mode.",
        )
