import logging
import urllib.parse
from typing import Any, Dict, Optional

from app.core.config import settings
from app.services.payments.base import (
    NormalizedPaymentStatus,
    PaymentOrderResult,
    PaymentProvider,
    PaymentVerificationResult,
    WebhookResult,
)

logger = logging.getLogger(__name__)


class ManualUPIProvider(PaymentProvider):
    """
    Fallback Manual UPI Payment Provider:
    - Participant sees college/fest UPI ID and QR code.
    - Status set to PENDING_MANUAL.
    - Participant submits their 12-digit UTR / transaction ID.
    - Admins/volunteers can review and mark PAID or REJECTED.
    """

    def __init__(self, upi_id: Optional[str] = None, upi_name: Optional[str] = None):
        self._upi_id = upi_id
        self._upi_name = upi_name

    @property
    def provider_name(self) -> str:
        return "manual_upi"

    @property
    def upi_id(self) -> str:
        if self._upi_id is not None:
            return self._upi_id.strip('\'"')
        return getattr(settings, "MANUAL_UPI_ID", "asthra26@upi").strip('\'"')

    @property
    def payee_name(self) -> str:
        if self._upi_name is not None:
            return self._upi_name.strip('\'"')
        return getattr(settings, "MANUAL_UPI_NAME", "Asthra 26 Mathematics Dept").strip('\'"')

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
        encoded_payee = urllib.parse.quote(self.payee_name)
        clean_receipt = (receipt or order_id)[:30]
        encoded_note = urllib.parse.quote(f"Pass-{clean_receipt}")

        # Standard NPCI UPI URI Scheme
        qr_payload = (
            f"upi://pay?pa={self.upi_id}&pn={encoded_payee}&am={amount:.2f}&cu=INR&tn={encoded_note}"
        )

        return PaymentOrderResult(
            provider=self.provider_name,
            order_id=order_id,
            amount=amount,
            currency="INR",
            status=NormalizedPaymentStatus.PENDING_MANUAL,
            checkout_data={
                "provider": "manual_upi",
                "order_id": order_id,
                "amount": amount,
                "currency": "INR",
                "upi_id": self.upi_id,
                "payee_name": self.payee_name,
                "qr_payload": qr_payload,
                "receipt": clean_receipt,
                "instructions": (
                    "Scan the QR code with any UPI app (GPay, PhonePe, Paytm, BHIM) "
                    "or transfer to the UPI ID. After paying, submit your 12-digit UTR / "
                    "Transaction Reference Number below."
                ),
            },
            raw_response={
                "order_id": order_id,
                "status": "PENDING_MANUAL",
                "upi_id": self.upi_id,
                "amount": amount,
            },
        )

    async def verify_payment(
        self,
        order_id: str,
        payload: Dict[str, Any],
        db_session: Any = None,
    ) -> PaymentVerificationResult:
        """
        Verify handler for manual UPI:
        - If action is 'approve': returns PAID.
        - If action is 'reject': returns FAILED.
        - Otherwise returns PENDING_MANUAL with current status message.
        """
        action = payload.get("action", "").lower()
        utr = payload.get("utr", "").strip()

        if action == "approve":
            return PaymentVerificationResult(
                success=True,
                status=NormalizedPaymentStatus.PAID,
                message="Manual UPI payment approved by reviewer.",
                provider=self.provider_name,
                order_id=order_id,
                payment_id=utr or f"MANUAL_{order_id}",
                raw_status="PAID",
                raw_response={"approved": True, "utr": utr},
            )
        elif action == "reject":
            reason = payload.get("rejection_reason", "UTR verification failed")
            return PaymentVerificationResult(
                success=False,
                status=NormalizedPaymentStatus.FAILED,
                message=f"Manual UPI payment rejected: {reason}",
                provider=self.provider_name,
                order_id=order_id,
                raw_status="REJECTED",
                raw_response={"rejected": True, "reason": reason},
            )

        # Still awaiting reviewer confirmation
        return PaymentVerificationResult(
            success=False,
            status=NormalizedPaymentStatus.PENDING_MANUAL,
            message="UTR submitted. Awaiting verification by fest coordinators.",
            provider=self.provider_name,
            order_id=order_id,
            raw_status="PENDING_MANUAL",
            raw_response={"utr": utr},
        )

    async def handle_webhook(
        self,
        raw_body: bytes,
        headers: Dict[str, str],
        db_session: Any = None,
    ) -> WebhookResult:
        # Manual UPI has no automated gateway webhook
        return WebhookResult(
            handled=False,
            message="Manual UPI does not support automated webhooks.",
        )

    async def get_order_status(self, order_id: str) -> PaymentVerificationResult:
        return PaymentVerificationResult(
            success=False,
            status=NormalizedPaymentStatus.PENDING_MANUAL,
            message="Awaiting manual verification.",
            provider=self.provider_name,
            order_id=order_id,
            raw_status="PENDING_MANUAL",
        )
