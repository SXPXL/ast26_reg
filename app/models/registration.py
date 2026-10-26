import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class AttendanceStatus(str, enum.Enum):
    NOT_ATTENDED = "NOT_ATTENDED"
    PRESENT = "PRESENT"
    HIDDEN = "HIDDEN"


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(
        String(36) if not hasattr(UUID, "as_uuid") else UUID(as_uuid=True),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    registration_code = Column(String(50), unique=True, index=True, nullable=False)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="RESTRICT"), nullable=False)

    # Primary Participant / Team Lead Information
    primary_name = Column(String(255), nullable=False)
    primary_email = Column(String(255), nullable=False, index=True)
    primary_phone = Column(String(30), nullable=False, index=True)
    college_name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    year_of_study = Column(String(50), nullable=False)
    course_and_semester = Column(String(100), nullable=True)

    # Team Info (if applicable)
    team_name = Column(String(255), nullable=True)

    # Financial and Status
    total_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    payment_mode = Column(String(30), default="ONLINE", nullable=False)
    payment_status = Column(String(30), default=PaymentStatus.PENDING.value, nullable=False, index=True)
    attendance_status = Column(String(30), default=AttendanceStatus.NOT_ATTENDED.value, nullable=False, index=True)

    # Attendance details
    attended_at = Column(DateTime(timezone=True), nullable=True)
    marked_by_volunteer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

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
    event = relationship("Event", back_populates="registrations")
    team_members = relationship(
        "TeamMember",
        back_populates="registration",
        cascade="all, delete-orphan",
    )
    payment_orders = relationship(
        "PaymentOrder",
        back_populates="registration",
        cascade="all, delete-orphan",
    )
    marked_by_volunteer = relationship("User", back_populates="marked_registrations")
