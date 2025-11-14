from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Annotated
import json
from faker import Faker
from . import faker_parser
from . import models, crud
from .database import engine, get_db, redis_client  # <-- Ensure redis_client is imported
import asyncio
import random
import time  # <-- NEW: Import time for timestamp

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- Dependencies ---
db_dependency = Annotated[Session, Depends(get_db)]
faker_instance = Faker()


@app.on_event("startup")
async def startup():
    print("Mock Engine starting up and connecting to DB...")


@app.api_route("/mock/{project_slug}/{full_path:path}",
               methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def handle_mock_request(
        project_slug: str,
        full_path: str,
        request: Request,
        db: db_dependency
):
    # --- Path Cleaning ---
    path = "/" + full_path
    method = request.method

    if len(path) > 1 and path.endswith('/'):
        path = path[:-1]
    # --- End Path Cleaning ---

    # 1. Find the project first (needed for the log channel)
    project = crud.get_project_by_slug(db, slug=project_slug)
    if not project:
        # We still log the attempt even if the project is not found
        log_payload = {
            "timestamp": time.time(),
            "method": method,
            "path": path,
            "status": 404,
            "detail": "Project Not Found",
            "project_slug": project_slug
        }
        redis_client.publish('mockapi:logs', json.dumps(log_payload))

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mock project with slug '{project_slug}' not found."
        )

    # --- NEW: LOGGING LOGIC (Happens on every successful project hit) ---
    log_payload = {
        "timestamp": time.time(),
        "method": method,
        "path": path,
        "status": 200,  # Assume success until proven otherwise
        "project_id": project.id,
        "project_slug": project_slug,
        "headers": dict(request.headers)
    }

    # 2. Publish the payload to Redis
    redis_client.publish('mockapi:logs', json.dumps(log_payload))
    print(f"Published log for: {project_slug}{path}")
    # --- END LOGGING LOGIC ---

    # --- STATEFUL LOGIC (Simplified for log clarity) ---
    if method == "POST":
        try:
            body_json = await request.json()
            crud.add_item_to_state(project.id, path, body_json)
        except json.JSONDecodeError:
            pass

    if method == "GET":
        state_data = crud.get_state_as_list(project.id, path)
        if state_data:
            return JSONResponse(
                status_code=200,
                content=state_data
            )

    # --- Fallback to static/Faker mocks ---

    endpoint = crud.find_matching_endpoint(
        db,
        project_id=project.id,
        path=path,
        method=method
    )
    if not endpoint:
        # If endpoint not found, we update the log status before returning 404
        log_payload['status'] = 404
        redis_client.publish('mockapi:logs', json.dumps(log_payload))

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No mock endpoint found for {method} {path}"
        )

    # ... (rest of the chaos logic, body parsing, and final JSONResponse return) ...
    mock_response = endpoint.responses[0]

    # --- CHAOS LOGIC ---
    if mock_response.delay_ms > 0:
        await asyncio.sleep(mock_response.delay_ms / 1000.0)

    if mock_response.failure_rate > 0.0:
        if random.random() < mock_response.failure_rate:
            log_payload['status'] = 500
            redis_client.publish('mockapi:logs', json.dumps(log_payload))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Mock server failure simulation"
            )

    # --- Final Response ---
    log_payload['status'] = mock_response.status_code
    redis_client.publish('mockapi:logs', json.dumps(log_payload))  # Final status log

    raw_body = mock_response.body

    # ... (body parsing logic is the same) ...
    if raw_body:
        parsed_body = faker_parser.parse_faker_string(raw_body, faker_instance)
    else:
        if method == "POST" and 'body_json' in locals():
            return JSONResponse(status_code=mock_response.status_code, content=body_json)
        parsed_body = None

    try:
        content_body = json.loads(parsed_body)
    except (json.JSONDecodeError, TypeError):
        content_body = parsed_body

    return JSONResponse(
        status_code=mock_response.status_code,
        content=content_body
    )