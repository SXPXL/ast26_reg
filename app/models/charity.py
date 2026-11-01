import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, DateTime, Numeric, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class CharityPaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class CharityDonation(Base):
    __tablename__ = "charity_donations"

    id = Column(
        String(36) if not hasattr(UUID, "as_uuid") else UUID(as_uuid=True),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    donation_code = Column(String(50), unique=True, index=True, nullable=False)
    donor_name = Column(String(255), nullable=False)
    donor_email = Column(String(255), nullable=False, index=True)
    donor_phone = Column(String(30), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)

    # Cashfree Gateway Details
    cf_order_id = Column(String(100), unique=True, index=True, nullable=False)
    cf_payment_session_id = Column(Text, nullable=True)
    payment_status = Column(
        String(30),
        default=CharityPaymentStatus.PENDING.value,
        nullable=False,
        index=True,
    )
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
