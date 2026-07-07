from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.permissions import require_role
from app.models.folder import Folder

router = APIRouter(prefix="/workspaces/{workspace_id}/folders", tags=["Folders"])


class CreateFolderRequest(BaseModel):
    name: str
    parent_id: Optional[int] = None


@router.post("/")
def create_folder(
    workspace_id: int,
    data: CreateFolderRequest,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin", "editor")),
):
    folder = Folder(
        workspace_id=workspace_id, name=data.name, parent_id=data.parent_id
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return {"id": folder.id, "name": folder.name, "parent_id": folder.parent_id}


@router.get("/")
def list_folders(
    workspace_id: int,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin", "editor", "viewer")),
):
    folders = db.query(Folder).filter(Folder.workspace_id == workspace_id).all()
    return [
        {"id": f.id, "name": f.name, "parent_id": f.parent_id} for f in folders
    ]