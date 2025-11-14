from sqlalchemy.orm import Session
from . import models, schemas, auth


# --- User Functions ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# --- RBAC & Member Functions ---

def get_user_role(db: Session, user_id: int, org_id: int):
    member = db.query(models.OrganizationMember) \
        .filter_by(user_id=user_id, organization_id=org_id) \
        .first()
    if member:
        return member.role
    return None


def add_organization_member(db: Session, org_id: int, user: models.User, role: models.Role):
    db_member = models.OrganizationMember(
        user_id=user.id,
        organization_id=org_id,
        role=role
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


def get_organization_members(db: Session, org_id: int):
    return db.query(models.OrganizationMember) \
        .filter_by(organization_id=org_id) \
        .all()


# --- Organization Functions ---
def create_organization(db: Session, org: schemas.OrganizationCreate, user: models.User):
    db_org = models.Organization(name=org.name)
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    add_organization_member(db, org_id=db_org.id, user=user, role=models.Role.owner)
    return db_org


def get_user_organizations(db: Session, user: models.User):
    return db.query(models.Organization) \
        .join(models.OrganizationMember) \
        .filter(models.OrganizationMember.user_id == user.id) \
        .all()


# --- Project Functions ---

def create_project(db: Session, project: schemas.ProjectCreate, org_id: int):
    db_project = models.Project(
        name=project.name,
        url_slug=project.url_slug,
        organization_id=org_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def get_organization_projects(db: Session, org_id: int):
    return db.query(models.Project) \
        .filter(models.Project.organization_id == org_id) \
        .all()


# --- Endpoint/Response Functions ---

def create_endpoint(db: Session, project_id: int, endpoint: schemas.EndpointCreate):
    db_endpoint = models.Endpoint(
        project_id=project_id,
        method=endpoint.method,
        path=endpoint.path,
        description=endpoint.description
    )
    db.add(db_endpoint)
    db.commit()
    db.refresh(db_endpoint)

    db_response = models.Response(
        endpoint_id=db_endpoint.id,
        status_code=endpoint.response.status_code,
        body=endpoint.response.body,
        delay_ms=endpoint.response.delay_ms,  # <-- NEW
        failure_rate=endpoint.response.failure_rate  # <-- NEW
    )
    db.add(db_response)
    db.commit()
    db.refresh(db_response)

    return db_endpoint