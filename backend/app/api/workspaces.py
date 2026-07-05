from app.core.permissions import get_current_user, require_role
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import re

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember

router = APIRouter(
    prefix="/workspaces",
    tags=["Workspaces"]
)


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


class CreateWorkspaceRequest(BaseModel):
    name: str


@router.post("/")
def create_workspace(
    data: CreateWorkspaceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slug = slugify(data.name)

    # Step 1: Create the workspace
    workspace = Workspace(
        name=data.name,
        slug=slug,
        owner_id=current_user.id,
    )

    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    # Step 2: Add the creator as an admin
    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="admin",
    )

    db.add(membership)
    db.commit()

    return {
        "id": workspace.id,
        "name": workspace.name,
        "slug": workspace.slug,
        "role": "admin",
    }
@router.get("/")
def list_my_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Join workspace_members -> workspaces, filtered to only THIS user's rows
    memberships = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.user_id == current_user.id)
        .all()
    )
    result = []
    for m in memberships:
        ws = db.query(Workspace).filter(Workspace.id == m.workspace_id).first()
        result.append({"id": ws.id, "name": ws.name, "slug": ws.slug, "role": m.role})
    return result
@router.get("/{workspace_id}/members")
def list_members(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Must be a member yourself to see the member list
    my_membership = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == current_user.id)
        .first()
    )
    if not my_membership:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")

    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).all()
    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        result.append({"user_id": user.id, "full_name": user.full_name, "email": user.email, "role": m.role})
    return result
class UpdateWorkspaceRequest(BaseModel):
    name: str

@router.put("/{workspace_id}")
def update_workspace(
    workspace_id: int,
    data: UpdateWorkspaceRequest,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin")),   # 403s automatically if not admin
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    workspace.name = data.name
    db.commit()
    return {"id": workspace.id, "name": workspace.name}

@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin")),
):
    db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).delete()
    db.query(Workspace).filter(Workspace.id == workspace_id).delete()
    db.commit()
    return {"message": "Workspace deleted"}