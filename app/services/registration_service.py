import random
import string
import uuid
from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.event import Event, EventType
from app.models.registration import PaymentStatus, Registration


def generate_unique_code(prefix: str = "ATHRA-2026") -> str:
    """Generate a clean, uppercase alphanumeric registration code."""
    random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{random_str}"


async def get_unique_registration_code(db: AsyncSession, prefix: str = "ATHRA-2026") -> str:
    """Ensure generated registration code is globally unique."""
    for _ in range(10):
        code = generate_unique_code(prefix)
        result = await db.execute(select(Registration).where(Registration.registration_code == code))
        if not result.scalars().first():
            return code
    # Fallback to UUID prefix if collisions happen
    return f"{prefix}-{uuid.uuid4().hex[:6].upper()}"


async def assign_team_number_if_needed(db: AsyncSession, registration: Registration) -> None:
    """
    Assigns sequential 'Team N' number to a team event registration ONLY when payment_status is SUCCESS.
    Numbering is strictly based on the count of confirmed (SUCCESS) teams for that event.
    """
    if registration.payment_status != PaymentStatus.SUCCESS.value:
        return

    # If the user already provided a custom team name, keep it
    if registration.team_name and not registration.team_name.startswith("Team "):
        return

    # If already assigned a Team number, do not overwrite
    if registration.team_name and registration.team_name.startswith("Team "):
        return

    # Load event if not loaded
    event = getattr(registration, "event", None)
    if not event:
        ev_res = await db.execute(select(Event).where(Event.id == registration.event_id))
        event = ev_res.scalars().first()

    if not event or event.event_type != EventType.TEAM.value:
        return

    # Count confirmed (SUCCESS) team registrations for this event excluding this one
    count_res = await db.execute(
        select(func.count(Registration.id)).where(
            Registration.event_id == event.id,
            Registration.payment_status == PaymentStatus.SUCCESS.value,
            Registration.id != registration.id,
        )
    )
    existing_team_count = count_res.scalar() or 0
    registration.team_name = f"Team {existing_team_count + 1}"

