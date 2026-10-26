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
    cf_order_id = Column(String(100), unique=True, index=True, nullable=False)
    cf_payment_id = Column(String(100), nullable=True)
    order_amount = Column(Numeric(10, 2), nullable=False)
    order_currency = Column(String(10), default="INR", nullable=False)
    payment_status = Column(String(30), default=PaymentOrderStatus.ACTIVE.value, nullable=False)
    cf_payment_session_id = Column(Text, nullable=True)
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
