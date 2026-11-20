import random
import string
import uuid
from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.event import Event, EventType
from app.models.registration import PaymentStatus, Registration


def generate_unique_code(prefix: str = "") -> str:
    """Generate a clean, uppercase alphanumeric registration code."""
    random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    if prefix:
        return f"{prefix}-{random_str}"
    return random_str


async def get_unique_registration_code(db: AsyncSession, prefix: str = "") -> str:
    """Ensure generated registration code is globally unique."""
    for _ in range(10):
        code = generate_unique_code(prefix)
        result = await db.execute(select(Registration).where(Registration.registration_code == code))
        if not result.scalars().first():
            return code
    # Fallback to UUID hex if collisions happen
    fallback = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{fallback}" if prefix else fallback


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

    # Find all existing team names for this event matching "Team %" to avoid collisions
    team_names_res = await db.execute(
        select(Registration.team_name).where(
            Registration.event_id == event.id,
            Registration.team_name.like("Team %"),
        )
    )
    existing_team_names = set(team_names_res.scalars().all())
    n = 1
    while f"Team {n}" in existing_team_names:
        n += 1
    registration.team_name = f"Team {n}"

