import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class PaymentOrderStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAID = "PAID"
    EXPIRED = "EXPIRED"
    FAILED = "FAILED"
    TERMINATED = "TERMINATED"
    PENDING_MANUAL = "PENDING_MANUAL"


class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id = Column(
        String(36) if not hasattr(UUID, "as_uuid") else UUID(as_uuid=True),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    registration_id = Column(
        String(36),
        ForeignKey("registrations.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Provider identification
    payment_provider = Column(String(50), default="razorpay", nullable=False)
    provider_order_id = Column(String(100), index=True, nullable=True)
    provider_payment_id = Column(String(100), nullable=True)

    # Legacy Cashfree columns kept for full backward compatibility
    cf_order_id = Column(String(100), unique=True, index=True, nullable=True)
    cf_payment_id = Column(String(100), nullable=True)
    cf_payment_session_id = Column(Text, nullable=True)

    # Financial details
    order_amount = Column(Numeric(10, 2), nullable=False)
    order_currency = Column(String(10), default="INR", nullable=False)
    payment_status = Column(String(30), default=PaymentOrderStatus.ACTIVE.value, nullable=False, index=True)

    # Manual UPI UTR & Verification
    utr = Column(String(100), nullable=True, index=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)

    # Raw gateway payload
    gateway_response = Column(JSON, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    registration = relationship("Registration", back_populates="payment_orders")

    @property
    def order_id(self) -> str:
        """Returns provider order ID or fallback to cf_order_id."""
        return self.provider_order_id or self.cf_order_id or ""
