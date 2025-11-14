from sqlalchemy.orm import Session
from sqlalchemy import and_
from . import models
from .database import redis_client  # NEW: Import redis_client
import json


# --- Project & Endpoint Functions (existing) ---

def get_project_by_slug(db: Session, slug: str):
    """Finds a project by its unique URL slug."""
    return db.query(models.Project).filter(models.Project.url_slug == slug).first()


def find_matching_endpoint(db: Session, project_id: int, path: str, method: str):
    """
    Finds the first matching endpoint for a project.
    We'll implement basic string matching for now.
    """
    # This is a simple version. It only finds exact matches.
    endpoint = db.query(models.Endpoint) \
        .filter_by(project_id=project_id, method=method, path=path) \
        .first()

    return endpoint


# --- NEW: Redis State Functions ---

def get_state_key(project_id: int, path: str) -> str:
    """Generates a consistent Redis key for a given resource path."""
    # e.g., "state:1:/users"
    return f"state:{project_id}:{path}"


def add_item_to_state(project_id: int, path: str, item: dict):
    """Adds a new item (as JSON) to a list in Redis."""
    key = get_state_key(project_id, path)
    item_json = json.dumps(item)
    redis_client.rpush(key, item_json)  # rpush = append to list


def get_state_as_list(project_id: int, path: str) -> list:
    """Retrieves all items for a given state key as a list of dicts."""
    key = get_state_key(project_id, path)
    # lrange(key, 0, -1) means "get all items from the list"
    items_json = redis_client.lrange(key, 0, -1)

    # Convert each JSON string back into a Python dict
    items = [json.loads(item) for item in items_json]
    return items


def clear_state(project_id: int, path: str):
    """Deletes a state key, clearing its list."""
    key = get_state_key(project_id, path)
    redis_client.delete(key)