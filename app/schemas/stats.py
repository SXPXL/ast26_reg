from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class CollegeStatItem(BaseModel):
    college_name: str
    count: int
    participants_count: int


class DepartmentStatItem(BaseModel):
    department: str
    count: int


class TimelineStatItem(BaseModel):
    date: str
    registrations: int
    revenue: Decimal


class EventStatItem(BaseModel):
    event_id: str
    event_title: str
    event_type: str
    registration_fee: Decimal = Decimal("0.00")
    max_capacity: int = 100
    is_active: bool = True
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
    overall_attendance_rate: float = 0.0
    total_revenue: Decimal
    online_revenue: Decimal = Decimal("0.00")
    offline_revenue: Decimal = Decimal("0.00")
    online_registrations_count: int = 0
    offline_registrations_count: int = 0
    solo_registrations_count: int = 0
    team_registrations_count: int = 0
    recent_registrations_count: int = 0
    top_colleges: List[CollegeStatItem] = []
    top_departments: List[DepartmentStatItem] = []
    recent_timeline: List[TimelineStatItem] = []
    event_stats: List[EventStatItem]

