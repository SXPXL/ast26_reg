from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class EventStatItem(BaseModel):
    event_id: str
    event_title: str
    event_type: str
    total_registrations: int
    confirmed_paid_registrations: int
    total_participants_count: int
    total_attended_count: int
    attendance_rate: float
    total_revenue: Decimal
    online_revenue: Decimal = Decimal("0.00")
    offline_revenue: Decimal = Decimal("0.00")


class OverallStatsResponse(BaseModel):
    total_events: int
    total_registrations: int
    total_confirmed_registrations: int
    total_participants: int
    total_checked_in: int
    total_revenue: Decimal
    online_revenue: Decimal = Decimal("0.00")
    offline_revenue: Decimal = Decimal("0.00")
    online_registrations_count: int = 0
    offline_registrations_count: int = 0
    recent_registrations_count: int
    event_stats: List[EventStatItem]
