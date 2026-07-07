import uuid
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_role, get_current_user
from app.core.storage import upload_file, get_download_url
from app.models.document import Document
from app.models.folder import DocumentTag
from app.models.user import User

# ONE router for the whole file — every route below is attached to this same object
router = APIRouter(
    prefix="/workspaces/{workspace_id}/documents", tags=["Documents"]
)


@router.post("/")
def upload_document(
    workspace_id: int,
    file: UploadFile = File(...),
    folder_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    member=Depends(require_role("admin", "editor")),
):
    if folder_id == 0:
        folder_id = None
    file_key = f"{workspace_id}/{uuid.uuid4()}_{file.filename}"

    file.file.seek(0, 2)
    size_bytes = file.file.tell()
    file.file.seek(0)

    upload_file(
        file.file, file_key, file.content_type or "application/octet-stream"
    )

    doc = Document(
        workspace_id=workspace_id,
        folder_id=folder_id,
        filename=file.filename,
        file_key=file_key,
        content_type=file.content_type,
        size_bytes=size_bytes,
        uploaded_by=member.user_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "filename": doc.filename,
        "size_bytes": doc.size_bytes,
        "status": doc.status,
    }


@router.get("/")
def list_documents(
    workspace_id: int,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin", "editor", "viewer")),
):
    docs = (
        db.query(Document).filter(Document.workspace_id == workspace_id).all()
    )
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "folder_id": d.folder_id,
            "size_bytes": d.size_bytes,
            "status": d.status,
            "created_at": d.created_at,
        }
        for d in docs
    ]


@router.get("/{document_id}")
def get_document(
    workspace_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin", "editor", "viewer")),
):
    doc = (
        db.query(Document)
        .filter(
            Document.id == document_id, Document.workspace_id == workspace_id
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "filename": doc.filename,
        "download_url": get_download_url(doc.file_key),
    }


class MoveDocumentRequest(BaseModel):
    folder_id: Optional[int] = None


@router.put("/{document_id}/move")
def move_document(
    workspace_id: int,
    document_id: int,
    data: MoveDocumentRequest,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin", "editor")),
):
    doc = (
        db.query(Document)
        .filter(
            Document.id == document_id, Document.workspace_id == workspace_id
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.folder_id = data.folder_id
    db.commit()
    return {"id": doc.id, "folder_id": doc.folder_id}


class AddTagsRequest(BaseModel):
    tags: list[str]


@router.post("/{document_id}/tags")
def add_tags(
    workspace_id: int,
    document_id: int,
    data: AddTagsRequest,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin", "editor")),
):
    for tag in data.tags:
        db.add(DocumentTag(document_id=document_id, tag=tag.strip().lower()))
    db.commit()
    return {"message": f"{len(data.tags)} tag(s) added"}