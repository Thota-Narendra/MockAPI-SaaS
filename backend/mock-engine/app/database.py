import os
import redis
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# --- MySQL Connection ---
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Redis Connection ---
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
# decode_responses=True makes it return strings instead of bytes
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()