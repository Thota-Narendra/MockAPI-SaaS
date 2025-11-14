from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect  # <-- CORRECTED IMPORT
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated, List
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import redis
import os
from asyncio import to_thread  # <-- Ensure to_thread is available

from . import models, schemas, crud, auth
from .database import SessionLocal, engine

# --- REDIS SETUP (For Pub/Sub) ---
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.Redis.from_url(REDIS_URL)

# This creates the tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS MIDDLEWARE ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


# --- Current User Dependency ---
def get_current_user(
        token: Annotated[str, Depends(auth.oauth2_scheme)],
        db: db_dependency
):
    """
    Decodes the token, gets the email, and returns the User object
    from the database.
    """
    token_data = auth.decode_access_token(token)
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


user_dependency = Annotated[models.User, Depends(get_current_user)]


@app.on_event("startup")
async def startup():
    print("Manager API starting up and connecting to DB...")


# --- NEW: WEB SOCKET LOGS ENDPOINT ---

def get_redis_pubsub():
    """Returns the Redis PubSub object for listening."""
    return redis_client.pubsub()


async def redis_consumer(websocket: WebSocket):
    """Subscribes to Redis and sends messages to the WebSocket client."""

    pubsub = await to_thread(get_redis_pubsub)
    await to_thread(pubsub.subscribe, 'mockapi:logs')

    try:
        # Get messages from the synchronous listener in a non-blocking way
        for message in pubsub.listen():
            if message['type'] == 'message':
                await websocket.send_text(message['data'].decode('utf-8'))
    finally:
        # Ensure cleanup happens if the loop breaks
        await to_thread(pubsub.unsubscribe, 'mockapi:logs')
        await to_thread(pubsub.close)


@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    # We create a task for the listener, so the main connection handler can stay alive
    listener_task = asyncio.create_task(redis_consumer(websocket))

    try:
        # Keep the connection alive until the client closes it
        while True:
            # We must await a message from the client to detect disconnects,
            # even if we don't use the message content.
            await websocket.receive_text()

    except WebSocketDisconnect:
        # Client closed the connection
        print("WebSocket client disconnected.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        # Cancel the listener task when the WebSocket disconnects
        listener_task.cancel()
        # Ensure the connection is closed
        await websocket.close()


@app.get("/")
def read_root():
    return {"message": "Hello from Manager API!"}


# --- Auth Endpoints (remaining endpoints are the same) ---
@app.post("/users/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: db_dependency):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)


@app.post("/token", response_model=schemas.Token)
def login_for_access_token(
        form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
        db: db_dependency
):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: user_dependency):
    return current_user


@app.post("/organizations", response_model=schemas.Organization, status_code=status.HTTP_201_CREATED)
def create_organization(
        org: schemas.OrganizationCreate,
        current_user: user_dependency,
        db: db_dependency
):
    return crud.create_organization(db=db, org=org, user=current_user)


@app.get("/organizations", response_model=List[schemas.Organization])
def read_user_organizations(
        current_user: user_dependency,
        db: db_dependency
):
    return crud.get_user_organizations(db=db, user=current_user)


@app.post("/organizations/{org_id}/invite", response_model=schemas.Member)
def invite_member(
        org_id: int,
        invite: schemas.MemberInvite,
        current_user: user_dependency,
        db: db_dependency
):
    role = crud.get_user_role(db, user_id=current_user.id, org_id=org_id)
    if role not in [models.Role.owner, models.Role.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to invite members"
        )
    user_to_invite = crud.get_user_by_email(db, email=invite.email)
    if not user_to_invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found"
        )
    if crud.get_user_role(db, user_id=user_to_invite.id, org_id=org_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this organization"
        )
    new_member = crud.add_organization_member(
        db,
        org_id=org_id,
        user=user_to_invite,
        role=invite.role
    )
    return schemas.Member(user=new_member.user, role=new_member.role)


@app.post("/organizations/{org_id}/projects", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
def create_project(
        org_id: int,
        project: schemas.ProjectCreate,
        current_user: user_dependency,
        db: db_dependency
):
    role = crud.get_user_role(db, user_id=current_user.id, org_id=org_id)
    if role not in [models.Role.owner, models.Role.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be an Owner or Admin to create projects"
        )
    return crud.create_project(db=db, project=project, org_id=org_id)


@app.post("/projects/{project_id}/endpoints", response_model=schemas.Endpoint, status_code=status.HTTP_201_CREATED)
def create_endpoint_for_project(
        project_id: int,
        endpoint: schemas.EndpointCreate,
        current_user: user_dependency,
        db: db_dependency
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    role = crud.get_user_role(db, user_id=current_user.id, org_id=project.organization_id)
    if role not in [models.Role.owner, models.Role.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be an Owner or Admin to create endpoints"
        )
    return crud.create_endpoint(db=db, project_id=project_id, endpoint=endpoint)