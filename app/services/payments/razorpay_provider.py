import hashlib
import hmac
import json
import logging
from typing import Any, Dict, Optional
import httpx

from app.core.config import settings
from app.services.payments.base import (
    NormalizedPaymentStatus,
    PaymentOrderResult,
    PaymentProvider,
    PaymentVerificationResult,
    WebhookResult,
)

logger = logging.getLogger(__name__)


class RazorpayProvider(PaymentProvider):
    """
    Razorpay Payment Gateway implementation.
    - Server-side order creation in paise (INR x 100) using registration code as receipt.
    - HMAC-SHA256 signature verification over 'order_id|payment_id' with constant-time comparison.
    - Idempotent webhook verification over raw request body using separate RAZORPAY_WEBHOOK_SECRET.
    """

    BASE_URL = "https://api.razorpay.com/v1"

    def __init__(
        self,
        key_id: Optional[str] = None,
        key_secret: Optional[str] = None,
        webhook_secret: Optional[str] = None,
    ):
        self._key_id = key_id
        self._key_secret = key_secret
        self._webhook_secret = webhook_secret

    @property
    def provider_name(self) -> str:
        return "razorpay"

    @property
    def key_id(self) -> str:
        if self._key_id is not None:
            return self._key_id.strip('\'"')
        return getattr(settings, "RAZORPAY_KEY_ID", "rzp_test_placeholder").strip('\'"')

    @property
    def key_secret(self) -> str:
        if self._key_secret is not None:
            return self._key_secret.strip('\'"')
        return getattr(settings, "RAZORPAY_KEY_SECRET", "placeholder_secret").strip('\'"')

    @property
    def webhook_secret(self) -> str:
        if self._webhook_secret is not None:
            return self._webhook_secret.strip('\'"')
        return getattr(settings, "RAZORPAY_WEBHOOK_SECRET", "placeholder_webhook_secret").strip('\'"')

    @property
    def is_mock(self) -> bool:
        """Determines if running in dummy/test offline mode."""
        return (
            not self.key_id
            or self.key_id.startswith("rzp_test_placeholder")
            or not self.key_secret
            or self.key_secret.startswith("placeholder")
        )

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
        # Amount in paise (INR x 100)
        amount_paise = int(round(amount * 100))

        # Receipt must be <= 40 chars in Razorpay
        clean_receipt = (receipt or order_id)[:40]

        order_notes = {
            "customer_id": str(customer_id),
            "receipt": clean_receipt,
            **(notes or {}),
        }

        # Offline Mock Fallback for local development when keys are placeholders
        if self.is_mock:
            mock_order_id = f"order_mock_{clean_receipt.replace('-', '_')}_{order_id[:8]}"
            logger.info(f"Using mock Razorpay order creation for offline testing: {mock_order_id}")
            return PaymentOrderResult(
                provider=self.provider_name,
                order_id=mock_order_id,
                amount=amount,
                currency="INR",
                status=NormalizedPaymentStatus.PENDING,
                checkout_data={
                    "provider": "razorpay",
                    "key_id": self.key_id,
                    "order_id": mock_order_id,
                    "amount": amount_paise,
                    "currency": "INR",
                    "name": "Asthra 26",
                    "description": f"Registration Pass - {clean_receipt}",
                    "prefill": {
                        "name": customer_name,
                        "email": customer_email,
                        "contact": customer_phone[-10:],
                    },
                    "notes": order_notes,
                    "is_mock": True,
                },
                raw_response={
                    "id": mock_order_id,
                    "entity": "order",
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "created",
                    "receipt": clean_receipt,
                },
            )

        payload = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": clean_receipt,
            "notes": order_notes,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(
                    f"{self.BASE_URL}/orders",
                    auth=(self.key_id, self.key_secret),
                    json=payload,
                )
                if response.status_code not in [200, 201]:
                    error_detail = response.text
                    logger.error(f"Razorpay order creation failed ({response.status_code}): {error_detail}")
                    raise Exception(f"Razorpay error: {error_detail}")

                rzp_order = response.json()
            except Exception as exc:
                logger.error(f"HTTP error creating Razorpay order: {exc}")
                raise

        rzp_order_id = rzp_order.get("id")

        return PaymentOrderResult(
            provider=self.provider_name,
            order_id=rzp_order_id,
            amount=amount,
            currency="INR",
            status=NormalizedPaymentStatus.PENDING,
            checkout_data={
                "provider": "razorpay",
                "key_id": self.key_id,
                "order_id": rzp_order_id,
                "amount": amount_paise,
                "currency": "INR",
                "name": "Asthra 26",
                "description": f"Registration Pass - {clean_receipt}",
                "prefill": {
                    "name": customer_name,
                    "email": customer_email,
                    "contact": customer_phone[-10:],
                },
                "notes": order_notes,
            },
            raw_response=rzp_order,
        )

    def verify_payment_signature(
        self,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> bool:
        """
        Verify Razorpay client payment signature:
        HMAC-SHA256 of 'order_id|payment_id' signed with key_secret.
        Uses constant-time comparison to prevent timing attacks.
        """
        if not order_id or not payment_id or not signature:
            return False

        # Support mock simulation in development offline mode
        if self.is_mock and signature.startswith("sig_mock_"):
            return True

        message = f"{order_id}|{payment_id}".encode("utf-8")
        secret = self.key_secret.encode("utf-8")
        generated_signature = hmac.new(secret, message, hashlib.sha256).hexdigest()

        return hmac.compare_digest(generated_signature, signature)

    async def verify_payment(
        self,
        order_id: str,
        payload: Dict[str, Any],
        db_session: Any = None,
    ) -> PaymentVerificationResult:
        """
        Verifies payment either via client signature payload:
          - razorpay_order_id
          - razorpay_payment_id
          - razorpay_signature
        Or queries Razorpay server status for the order.
        """
        rzp_order_id = payload.get("razorpay_order_id") or order_id
        rzp_payment_id = payload.get("razorpay_payment_id")
        rzp_signature = payload.get("razorpay_signature")

        # Case 1: Client submitted signature payload
        if rzp_payment_id and rzp_signature:
            is_valid = self.verify_payment_signature(rzp_order_id, rzp_payment_id, rzp_signature)
            if not is_valid:
                logger.warning(f"Tampered or invalid Razorpay signature for order {rzp_order_id}")
                return PaymentVerificationResult(
                    success=False,
                    status=NormalizedPaymentStatus.FAILED,
                    message="Invalid payment signature. Verification failed.",
                    provider=self.provider_name,
                    order_id=rzp_order_id,
                    payment_id=rzp_payment_id,
                    raw_status="SIGNATURE_VERIFICATION_FAILED",
                )

            # Valid signature: verified authentic payment
            return PaymentVerificationResult(
                success=True,
                status=NormalizedPaymentStatus.PAID,
                message="Payment verified successfully with Razorpay.",
                provider=self.provider_name,
                order_id=rzp_order_id,
                payment_id=rzp_payment_id,
                raw_status="PAID",
                raw_response={"verified_via": "signature", "payment_id": rzp_payment_id},
            )

        # Case 2: Server-to-server query via Razorpay API (e.g. return check or recheck)
        if self.is_mock:
            return PaymentVerificationResult(
                success=False,
                status=NormalizedPaymentStatus.PENDING,
                message="Payment is pending in mock environment.",
                provider=self.provider_name,
                order_id=order_id,
            )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(
                    f"{self.BASE_URL}/orders/{order_id}",
                    auth=(self.key_id, self.key_secret),
                )
                if res.status_code == 200:
                    data = res.json()
                    st = data.get("status", "").lower()
                    amount = float(data.get("amount_paid", 0)) / 100.0

                    if st == "paid":
                        # Fetch payments for this order to retrieve payment ID
                        pay_res = await client.get(
                            f"{self.BASE_URL}/orders/{order_id}/payments",
                            auth=(self.key_id, self.key_secret),
                        )
                        items = pay_res.json().get("items", []) if pay_res.status_code == 200 else []
                        captured_id = items[0].get("id") if items else None

                        return PaymentVerificationResult(
                            success=True,
                            status=NormalizedPaymentStatus.PAID,
                            message="Payment verified successfully via Razorpay Order status.",
                            provider=self.provider_name,
                            order_id=order_id,
                            payment_id=captured_id,
                            amount=amount,
                            raw_status="PAID",
                            raw_response=data,
                        )
                    else:
                        return PaymentVerificationResult(
                            success=False,
                            status=NormalizedPaymentStatus.PENDING,
                            message=f"Order is currently {st}.",
                            provider=self.provider_name,
                            order_id=order_id,
                            raw_status=st.upper(),
                            raw_response=data,
                        )
        except Exception as e:
            logger.error(f"Error checking order status on Razorpay: {e}")

        return PaymentVerificationResult(
            success=False,
            status=NormalizedPaymentStatus.PENDING,
            message="Payment verification awaiting completion or confirmation.",
            provider=self.provider_name,
            order_id=order_id,
        )

    def verify_webhook_signature(self, raw_body: bytes, signature: Optional[str]) -> bool:
        """
        Verify Razorpay Webhook signature:
        HMAC-SHA256 of raw request body signed with RAZORPAY_WEBHOOK_SECRET.
        """
        if not signature or not self.webhook_secret:
            return False

        secret = self.webhook_secret.encode("utf-8")
        expected_signature = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()

        return hmac.compare_digest(expected_signature, signature)

    async def handle_webhook(
        self,
        raw_body: bytes,
        headers: Dict[str, str],
        db_session: Any = None,
    ) -> WebhookResult:
        """
        Handles incoming Razorpay webhook events:
          - payment.captured
          - order.paid
          - payment.failed
        Verifies X-Razorpay-Signature over the raw body.
        """
        lower_headers = {k.lower(): v for k, v in headers.items()}
        signature = lower_headers.get("x-razorpay-signature")

        if not self.verify_webhook_signature(raw_body, signature):
            logger.warning("Rejected Razorpay webhook: invalid signature.")
            return WebhookResult(
                handled=False,
                message="Invalid Razorpay webhook signature.",
            )

        try:
            payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        except Exception as e:
            logger.error(f"Failed to parse Razorpay webhook payload: {e}")
            return WebhookResult(handled=False, message="Invalid JSON payload")

        event = payload.get("event", "")
        payload_data = payload.get("payload", {})

        order_id = None
        payment_id = None
        status = None

        if event in ["payment.captured", "payment.authorized"]:
            payment_entity = payload_data.get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            payment_id = payment_entity.get("id")
            status = NormalizedPaymentStatus.PAID
        elif event == "order.paid":
            order_entity = payload_data.get("order", {}).get("entity", {})
            order_id = order_entity.get("id")
            status = NormalizedPaymentStatus.PAID
        elif event == "payment.failed":
            payment_entity = payload_data.get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            payment_id = payment_entity.get("id")
            status = NormalizedPaymentStatus.FAILED
        else:
            logger.info(f"Ignored unhandled Razorpay webhook event: {event}")
            return WebhookResult(
                handled=True,
                event_type=event,
                message=f"Ignored event {event}",
                raw_payload=payload,
            )

        return WebhookResult(
            handled=True,
            order_id=order_id,
            status=status,
            payment_id=payment_id,
            event_type=event,
            message=f"Razorpay webhook {event} processed",
            raw_payload=payload,
        )

    async def get_order_status(self, order_id: str) -> PaymentVerificationResult:
        return await self.verify_payment(order_id, {})
