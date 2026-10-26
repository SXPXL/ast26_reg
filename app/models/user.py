import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Boolean, Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    VOLUNTEER = "VOLUNTEER"
    PARTICIPANT = "PARTICIPANT"


class User(Base):
    __tablename__ = "users"

    id = Column(
        String(36) if not hasattr(UUID, "as_uuid") else UUID(as_uuid=True),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(String(30), default=UserRole.PARTICIPANT.value, nullable=False)
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
    assigned_events = relationship(
        "EventVolunteer",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    marked_registrations = relationship(
        "Registration",
        back_populates="marked_by_volunteer",
    )
