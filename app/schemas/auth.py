from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.PARTICIPANT


class UserCreate(UserBase):
    password: str


class VolunteerCreate(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: str
    phone: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    username: str
    password: str
class ChangeCredentialsRequest(BaseModel):
    new_username: Optional[str] = None
    new_password: Optional[str] = None
    current_password: Optional[str] = None



class UserResponse(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
