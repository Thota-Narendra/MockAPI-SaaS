from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


# --- Re-define existing models from manager-api ---
class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True)
    projects = relationship("Project", back_populates="organization")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    url_slug = Column(String(255), unique=True, index=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    organization = relationship("Organization", back_populates="projects")
    endpoints = relationship("Endpoint", back_populates="project")


# --- NEW Models for Mock Engine ---

class HttpMethod(enum.Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    OPTIONS = "OPTIONS"
    HEAD = "HEAD"


class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    method = Column(Enum(HttpMethod), nullable=False)
    path = Column(String(2048), nullable=False)
    description = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="endpoints")
    responses = relationship("Response", back_populates="endpoint", cascade="all, delete-orphan")


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id"), nullable=False)

    status_code = Column(Integer, nullable=False, default=200)
    body = Column(Text)

    # --- CHAOS COLUMNS ---
    delay_ms = Column(Integer, default=0)
    failure_rate = Column(Float, default=0.0)

    endpoint = relationship("Endpoint", back_populates="responses")