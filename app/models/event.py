import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class EventType(str, enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    TEAM = "TEAM"


class Event(Base):
    __tablename__ = "events"

    id = Column(
        String(36) if not hasattr(UUID, "as_uuid") else UUID(as_uuid=True),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    event_type = Column(String(30), default=EventType.INDIVIDUAL.value, nullable=False)
    min_team_size = Column(Integer, default=1, nullable=False)
    max_team_size = Column(Integer, default=1, nullable=False)
    registration_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    max_capacity = Column(Integer, nullable=True)
    registration_deadline = Column(DateTime(timezone=True), nullable=False)
    event_date = Column(DateTime(timezone=True), nullable=False)
    venue = Column(String(255), nullable=False)
    rules = Column(Text, nullable=True)
    image_url = Column(String(1000), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

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
    volunteers = relationship(
        "EventVolunteer",
        back_populates="event",
        cascade="all, delete-orphan",
    )
    registrations = relationship(
        "Registration",
        back_populates="event",
        cascade="all, delete-orphan",
    )


class EventVolunteer(Base):
    __tablename__ = "event_volunteers"

    id = Column(
        String(36) if not hasattr(UUID, "as_uuid") else UUID(as_uuid=True),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_volunteer"),
    )

    # Relationships
    event = relationship("Event", back_populates="volunteers")
    user = relationship("User", back_populates="assigned_events")
