from pydantic import BaseModel, EmailStr
from datetime import datetime
from .models import Role, HttpMethod
from typing import List


# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    url_slug: str


class ProjectCreate(ProjectBase):
    pass


# --- Response Schemas (Define BEFORE Endpoint) ---
class ResponseBase(BaseModel):
    status_code: int = 200
    body: str | None = None
    delay_ms: int = 0  # <-- NEW
    failure_rate: float = 0.0  # <-- NEW


class ResponseCreate(ResponseBase):
    pass


class Response(ResponseBase):
    id: int
    endpoint_id: int

    class Config:
        from_attributes = True


# --- Endpoint Schemas (Define BEFORE updating Project) ---
class EndpointBase(BaseModel):
    method: HttpMethod
    path: str
    description: str | None = None


class EndpointCreate(EndpointBase):
    response: ResponseCreate


class Endpoint(EndpointBase):
    id: int
    project_id: int
    responses: List[Response] = []

    class Config:
        from_attributes = True


# --- Update Project Schema ---
class Project(ProjectBase):
    id: int
    organization_id: int
    created_at: datetime
    endpoints: List[Endpoint] = []

    class Config:
        from_attributes = True


# --- Member Schemas ---
class MemberInvite(BaseModel):
    email: EmailStr
    role: Role = Role.viewer


class Member(BaseModel):
    user: User
    role: Role

    class Config:
        from_attributes = True


# --- Organization Schemas ---
class OrganizationBase(BaseModel):
    name: str


class OrganizationCreate(OrganizationBase):
    pass


class Organization(OrganizationBase):
    id: int
    created_at: datetime
    projects: List[Project] = []
    members: List[Member] = []

    class Config:
        from_attributes = True