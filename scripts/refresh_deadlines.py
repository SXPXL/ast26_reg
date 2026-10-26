import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
from app.db.session import engine
from sqlalchemy import text

async def run():
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE events SET registration_deadline = NOW() + INTERVAL '30 days', event_date = NOW() + INTERVAL '35 days'"))
        print('Events deadlines refreshed to future dates successfully!')

if __name__ == '__main__':
    asyncio.run(run())
