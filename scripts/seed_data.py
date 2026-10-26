import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# On Windows, psycopg async requires WindowsSelectorEventLoopPolicy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal, Base, engine
from app.models.event import Event, EventType, EventVolunteer
from app.models.user import User, UserRole


async def seed():
    print("Connecting to database and creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);"))
            await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);"))
            await conn.execute(text("UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL;"))
        except Exception as e:
            print(f"Notice during column verification: {e}")

    async with AsyncSessionLocal() as db:
        # 1. Create Default Admin
        admin_email = "admin@fest.com"
        admin_res = await db.execute(select(User).where(User.email == admin_email))
        admin = admin_res.scalars().first()

        if not admin:
            admin = User(
                email=admin_email,
                username="admin",
                hashed_password=get_password_hash("Admin@12345"),
                full_name="Fest Main Admin",
                phone="9876543200",
                role=UserRole.ADMIN.value,
                is_active=True,
            )
            db.add(admin)
            print(f"Created Admin: username='admin', {admin_email} / Admin@12345")
        else:
            if not admin.username:
                admin.username = "admin"
            print(f"Admin {admin_email} (username: {admin.username}) ready.")

        # 2. Create Default Volunteer
        vol_email = "volunteer@fest.com"
        vol_res = await db.execute(select(User).where(User.email == vol_email))
        volunteer = vol_res.scalars().first()

        if not volunteer:
            volunteer = User(
                email=vol_email,
                username="volunteer",
                hashed_password=get_password_hash("Volunteer@12345"),
                full_name="Alex Volunteer",
                phone="9876543201",
                role=UserRole.VOLUNTEER.value,
                is_active=True,
            )
            db.add(volunteer)
            print(f"Created Volunteer: username='volunteer', {vol_email} / Volunteer@12345")
        else:
            if not volunteer.username:
                volunteer.username = "volunteer"
            print(f"Volunteer {vol_email} (username: {volunteer.username}) ready.")

        await db.commit()
        if admin:
            await db.refresh(admin)
        if volunteer:
            await db.refresh(volunteer)

        # 3. Create Sample Events
        event1_slug = "hack-athra-2026"
        e1_res = await db.execute(select(Event).where(Event.slug == event1_slug))
        event1 = e1_res.scalars().first()

        if not event1:
            event1 = Event(
                title="HackAthra 24h Hackathon",
                slug=event1_slug,
                description="A 24-hour national level hackathon solving real-world challenges in AI, Web3, and IoT.",
                event_type=EventType.TEAM.value,
                min_team_size=2,
                max_team_size=4,
                registration_fee=Decimal("400.00"),
                max_capacity=50,
                registration_deadline=datetime.now(timezone.utc) + timedelta(days=20),
                event_date=datetime.now(timezone.utc) + timedelta(days=25),
                venue="Main Auditorium, Tech Block",
                rules="1. Maximum team size is 4. 2. Hardware/Laptops must be brought by participants. 3. Code must be original.",
                image_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
                is_active=True,
            )
            db.add(event1)
            print("Created Event: HackAthra")

        event2_slug = "code-sprint"
        e2_res = await db.execute(select(Event).where(Event.slug == event2_slug))
        event2 = e2_res.scalars().first()

        if not event2:
            event2 = Event(
                title="CodeSprint Competitive Programming",
                slug=event2_slug,
                description="Fast-paced individual algorithmic contest testing speed, logic, and optimization.",
                event_type=EventType.INDIVIDUAL.value,
                min_team_size=1,
                max_team_size=1,
                registration_fee=Decimal("100.00"),
                max_capacity=100,
                registration_deadline=datetime.now(timezone.utc) + timedelta(days=15),
                event_date=datetime.now(timezone.utc) + timedelta(days=18),
                venue="Computer Lab 3, 2nd Floor",
                rules="1. Individual participation only. 2. Supported languages: C++, Python, Java.",
                image_url="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60",
                is_active=True,
            )
            db.add(event2)
            print("Created Event: CodeSprint")

        await db.commit()

        # Assign volunteer to event 1
        if volunteer and event1:
            await db.refresh(event1)
            assign_res = await db.execute(
                select(EventVolunteer).where(
                    EventVolunteer.event_id == event1.id,
                    EventVolunteer.user_id == volunteer.id,
                )
            )
            if not assign_res.scalars().first():
                db.add(EventVolunteer(event_id=event1.id, user_id=volunteer.id))
                await db.commit()
                print("Assigned Volunteer Alex to HackAthra event.")

    print("\nDatabase seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
