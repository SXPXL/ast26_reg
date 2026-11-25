import logging
from typing import Any, Dict, Optional
import httpx

from app.core.config import settings
from app.services.cashfree_service import cashfree_service
from app.services.payments.base import (
    NormalizedPaymentStatus,
    PaymentOrderResult,
    PaymentProvider,
    PaymentVerificationResult,
    WebhookResult,
)

logger = logging.getLogger(__name__)


class CashfreeProvider(PaymentProvider):
    """Adapter wrapping Cashfree PG into the standardized PaymentProvider interface."""

    @property
    def provider_name(self) -> str:
        return "cashfree"

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
        cf_response = await cashfree_service.create_order(
            order_id=order_id,
            order_amount=amount,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            return_url=return_url,
        )

        payment_session_id = cf_response.get("payment_session_id")

        return PaymentOrderResult(
            provider=self.provider_name,
            order_id=order_id,
            amount=amount,
            currency="INR",
            status=NormalizedPaymentStatus.PENDING,
            checkout_data={
                "provider": "cashfree",
                "order_id": order_id,
                "payment_session_id": payment_session_id,
                "environment": cashfree_service.env_mode,
                "cf_link": cf_response.get("payment_link"),
            },
            raw_response=cf_response,
        )

    async def verify_payment(
        self,
        order_id: str,
        payload: Dict[str, Any],
        db_session: Any = None,
    ) -> PaymentVerificationResult:
        try:
            cf_status = await cashfree_service.get_order_status(order_id)
        except Exception as e:
            logger.error(f"Cashfree get_order_status error for {order_id}: {e}")
            return PaymentVerificationResult(
                success=False,
                status=NormalizedPaymentStatus.PENDING,
                message=f"Gateway query error: {str(e)}",
                provider=self.provider_name,
                order_id=order_id,
                raw_response={},
            )

        cf_order_status = str(cf_status.get("order_status", "ACTIVE")).upper()
        amount = float(cf_status.get("order_amount", 0.0))

        if cf_order_status == "PAID":
            payments = await cashfree_service.get_order_payments(order_id)
            payment_id = payments[0].get("cf_payment_id") if payments else None
            return PaymentVerificationResult(
                success=True,
                status=NormalizedPaymentStatus.PAID,
                message="Payment verified successfully with Cashfree.",
                provider=self.provider_name,
                order_id=order_id,
                payment_id=str(payment_id) if payment_id else None,
                amount=amount,
                raw_status=cf_order_status,
                raw_response=cf_status,
            )
        elif cf_order_status in ["EXPIRED", "TERMINATED", "CANCELLED"]:
            return PaymentVerificationResult(
                success=False,
                status=NormalizedPaymentStatus.FAILED,
                message=f"Order {cf_order_status.lower()}.",
                provider=self.provider_name,
                order_id=order_id,
                amount=amount,
                raw_status=cf_order_status,
                raw_response=cf_status,
            )
        else:
            # Check individual payment attempts
            payments = await cashfree_service.get_order_payments(order_id)
            if payments:
                if any(p.get("payment_status", "").upper() == "SUCCESS" for p in payments):
                    succ_p = next(p for p in payments if p.get("payment_status", "").upper() == "SUCCESS")
                    return PaymentVerificationResult(
                        success=True,
                        status=NormalizedPaymentStatus.PAID,
                        message="Payment verified successfully.",
                        provider=self.provider_name,
                        order_id=order_id,
                        payment_id=str(succ_p.get("cf_payment_id")),
                        amount=amount,
                        raw_status="PAID",
                        raw_response=cf_status,
                    )
                latest = payments[0]
                latest_st = latest.get("payment_status", "").upper()
                if latest_st in ["FAILED", "USER_DROPPED", "CANCELLED"]:
                    return PaymentVerificationResult(
                        success=False,
                        status=NormalizedPaymentStatus.FAILED,
                        message=latest.get("payment_message") or f"Payment {latest_st.lower()}.",
                        provider=self.provider_name,
                        order_id=order_id,
                        amount=amount,
                        raw_status=latest_st,
                        raw_response=cf_status,
                    )

            return PaymentVerificationResult(
                success=False,
                status=NormalizedPaymentStatus.PENDING,
                message="Payment awaiting completion at Cashfree.",
                provider=self.provider_name,
                order_id=order_id,
                amount=amount,
                raw_status=cf_order_status,
                raw_response=cf_status,
            )

    async def handle_webhook(
        self,
        raw_body: bytes,
        headers: Dict[str, str],
        db_session: Any = None,
    ) -> WebhookResult:
        # Cashfree headers are case-insensitive
        lower_headers = {k.lower(): v for k, v in headers.items()}
        signature = lower_headers.get("x-webhook-signature")
        timestamp = lower_headers.get("x-webhook-timestamp")

        if not cashfree_service.verify_webhook_signature(raw_body, timestamp, signature):
            return WebhookResult(
                handled=False,
                message="Invalid Cashfree webhook signature.",
            )

        import json
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        event_type = payload.get("type", "")
        data = payload.get("data", {})
        order_info = data.get("order", {})
        order_id = order_info.get("order_id")

        status = NormalizedPaymentStatus.PENDING
        payment_id = None
        if event_type == "PAYMENT_SUCCESS_WEBHOOK":
            status = NormalizedPaymentStatus.PAID
            payment_info = data.get("payment", {})
            payment_id = str(payment_info.get("cf_payment_id", ""))
        elif event_type in ["PAYMENT_FAILED_WEBHOOK", "PAYMENT_USER_DROPPED_WEBHOOK"]:
            status = NormalizedPaymentStatus.FAILED

        return WebhookResult(
            handled=True,
            order_id=order_id,
            status=status,
            payment_id=payment_id,
            event_type=event_type,
            message=f"Cashfree event {event_type}",
            raw_payload=payload,
        )

    async def get_order_status(self, order_id: str) -> PaymentVerificationResult:
        return await self.verify_payment(order_id, {})
