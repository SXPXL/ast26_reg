# Import all models so Base has them registered for metadata creation
from app.db.session import Base
from app.models.user import User, UserRole
from app.models.event import Event, EventVolunteer, EventType
from app.models.registration import Registration, PaymentStatus, AttendanceStatus
from app.models.team_member import TeamMember
from app.models.payment import PaymentOrder, PaymentOrderStatus

__all__ = [
    "Base",
    "User",
    "UserRole",
    "Event",
    "EventVolunteer",
    "EventType",
    "Registration",
    "PaymentStatus",
    "AttendanceStatus",
    "TeamMember",
    "PaymentOrder",
    "PaymentOrderStatus",
]
