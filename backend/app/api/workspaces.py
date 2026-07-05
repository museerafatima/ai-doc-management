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

from app.models.workspace import Invitation


class InviteRequest(BaseModel):
    email: str
    role: str = "viewer"


@router.post("/{workspace_id}/invite")
def invite_member(
    workspace_id: int,
    data: InviteRequest,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin")),
):
    if data.role not in ("admin", "editor", "viewer"):
        raise HTTPException(
            status_code=400,
            detail="Role must be admin, editor, or viewer",
        )

    invite = Invitation(
        workspace_id=workspace_id,
        email=data.email,
        role=data.role,
        invited_by=member.user_id,
    )

    db.add(invite)
    db.commit()
    db.refresh(invite)

    # In production, this token is emailed as a link:
    # yourapp.com/invite/accept?token=...

    return {
        "message": "Invite created",
        "invite_token": invite.token,
    }
class AcceptInviteRequest(BaseModel):
    token: str


@router.post("/invites/accept")
def accept_invite(
    data: AcceptInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invite = (
        db.query(Invitation)
        .filter(Invitation.token == data.token)
        .first()
    )

    if not invite or invite.status != "pending":
        raise HTTPException(
            status_code=404,
            detail="Invite not found or already used",
        )

    if invite.email.lower() != current_user.email.lower():
        raise HTTPException(
            status_code=403,
            detail="This invite was sent to a different email address",
        )

    # Don't create a duplicate membership if the user is already in the workspace
    existing = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == invite.workspace_id,
            WorkspaceMember.user_id == current_user.id,
        )
        .first()
    )

    if not existing:
        db.add(
            WorkspaceMember(
                workspace_id=invite.workspace_id,
                user_id=current_user.id,
                role=invite.role,
            )
        )

    invite.status = "accepted"
    db.commit()

    return {
        "message": "You joined the workspace",
        "workspace_id": invite.workspace_id,
        "role": invite.role,
    }
@router.get("/{workspace_id}/invites")
def list_invites(
    workspace_id: int,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin")),
):
    invites = (
        db.query(Invitation)
        .filter(
            Invitation.workspace_id == workspace_id,
            Invitation.status == "pending",
        )
        .all()
    )

    return [
        {
            "email": invite.email,
            "role": invite.role,
            "sent_at": invite.created_at,
        }
        for invite in invites
    ]