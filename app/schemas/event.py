from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator
from app.models.event import EventType


class EventBase(BaseModel):
    title: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    description: str
    event_type: EventType = EventType.INDIVIDUAL
    min_team_size: int = Field(default=1, ge=1)
    max_team_size: int = Field(default=1, ge=1)
    registration_fee: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    max_capacity: Optional[int] = Field(default=None, ge=1)
    registration_deadline: datetime
    event_date: datetime
    venue: str = Field(..., max_length=255)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    rules: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

    @model_validator(mode="after")
    def validate_team_sizes(self):
        if self.event_type == EventType.INDIVIDUAL:
            if self.min_team_size != 1 or self.max_team_size != 1:
                self.min_team_size = 1
                self.max_team_size = 1
        elif self.event_type == EventType.TEAM:
            if self.min_team_size < 2:
                raise ValueError("Team event min_team_size must be at least 2.")
            if self.max_team_size < self.min_team_size:
                raise ValueError("max_team_size must be greater than or equal to min_team_size.")
        return self


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    min_team_size: Optional[int] = None
    max_team_size: Optional[int] = None
    registration_fee: Optional[Decimal] = None
    max_capacity: Optional[int] = None
    registration_deadline: Optional[datetime] = None
    event_date: Optional[datetime] = None
    venue: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    rules: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class VolunteerSimple(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class EventResponse(EventBase):
    id: str
    created_at: datetime
    updated_at: datetime
    total_registrations: Optional[int] = 0

    class Config:
        from_attributes = True


class EventDetailResponse(EventResponse):
    volunteers: List[VolunteerSimple] = []


class AssignVolunteersRequest(BaseModel):
    user_ids: List[str]
