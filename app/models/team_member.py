import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class TeamMember(Base):
    __tablename__ = "team_members"

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
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=False)
    college_name = Column(String(255), nullable=False)
    roll_no = Column(String(100), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    registration = relationship("Registration", back_populates="team_members")
