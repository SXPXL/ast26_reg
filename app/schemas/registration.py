from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.registration import AttendanceStatus, PaymentStatus


class TeamMemberCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    college_name: str
    roll_no: Optional[str] = None


class TeamMemberResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    college_name: str
    roll_no: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RegistrationCreate(BaseModel):
    event_id: str
    primary_name: str = Field(..., max_length=255)
    primary_email: EmailStr
    primary_phone: str = Field(..., max_length=30)
    college_name: str = Field(..., max_length=255)
    department: str = Field(..., max_length=255)
    year_of_study: str = Field(..., max_length=50)
    team_name: Optional[str] = None
    team_members: List[TeamMemberCreate] = []


class RegistrationSummary(BaseModel):
    id: str
    registration_code: str
    event_id: str
    event_title: Optional[str] = None
    primary_name: str
    primary_email: str
    primary_phone: str
    college_name: str
    department: str
    year_of_study: str
    team_name: Optional[str] = None
    total_amount: Decimal
    payment_status: PaymentStatus
    attendance_status: AttendanceStatus
    attended_at: Optional[datetime] = None
    marked_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RegistrationDetailResponse(RegistrationSummary):
    team_members: List[TeamMemberResponse] = []


class AttendanceUpdateRequest(BaseModel):
    attendance_status: AttendanceStatus


class RegistrationCreatedResponse(BaseModel):
    registration_code: str
    registration_id: str
    total_amount: Decimal
    payment_status: PaymentStatus
    payment_session: Optional[dict] = None
