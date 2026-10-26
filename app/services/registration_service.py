import random
import string
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.registration import Registration


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
