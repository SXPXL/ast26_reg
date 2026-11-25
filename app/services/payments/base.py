from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import enum
from typing import Any, Dict, Optional


class NormalizedPaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    PENDING_MANUAL = "PENDING_MANUAL"


@dataclass
class PaymentOrderResult:
    """Normalized output from order creation across all payment providers."""
    provider: str
    order_id: str
    amount: float
    currency: str = "INR"
    status: NormalizedPaymentStatus = NormalizedPaymentStatus.PENDING
    checkout_data: Dict[str, Any] = field(default_factory=dict)
    raw_response: Dict[str, Any] = field(default_factory=dict)

    @property
    def qr_payload(self) -> Optional[str]:
        return self.checkout_data.get("qr_payload")

    @property
    def upi_id(self) -> Optional[str]:
        return self.checkout_data.get("upi_id")


@dataclass
class PaymentVerificationResult:
    """Normalized output from payment verification across all payment providers."""
    success: bool
    status: NormalizedPaymentStatus
    message: str
    provider: str
    order_id: str
    payment_id: Optional[str] = None
    amount: Optional[float] = None
    raw_status: Optional[str] = None
    raw_response: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WebhookResult:
    """Normalized output from processing incoming gateway webhooks."""
    handled: bool
    order_id: Optional[str] = None
    status: Optional[NormalizedPaymentStatus] = None
    payment_id: Optional[str] = None
    event_type: Optional[str] = None
    message: str = ""
    raw_payload: Dict[str, Any] = field(default_factory=dict)

    @property
    def success(self) -> bool:
        return self.handled

    @property
    def raw_data(self) -> Dict[str, Any]:
        return self.raw_payload


class PaymentProvider(ABC):
    """Abstract interface defining the standardized payment gateway contract."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Normalized unique name of the payment provider (e.g. razorpay, cashfree, manual_upi)."""
        pass

    @property
    def name(self) -> str:
        return self.provider_name

    @abstractmethod
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
        """Create an order on the provider and return normalized checkout parameters."""
        pass

    @abstractmethod
    async def verify_payment(
        self,
        order_id: str,
        payload: Dict[str, Any],
        db_session: Any = None,
    ) -> PaymentVerificationResult:
        """Verify the authenticity of a payment return or client signature."""
        pass

    @abstractmethod
    async def handle_webhook(
        self,
        raw_body: bytes,
        headers: Dict[str, str],
        db_session: Any = None,
    ) -> WebhookResult:
        """Validate and parse incoming asynchronous webhook events from the provider."""
        pass

    @abstractmethod
    async def get_order_status(
        self,
        order_id: str,
    ) -> PaymentVerificationResult:
        """Direct server-to-server query of the current order status."""
        pass
