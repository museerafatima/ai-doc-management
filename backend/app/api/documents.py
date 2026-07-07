import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.permissions import require_role, get_current_user
from app.core.storage import upload_file, get_download_url
from app.models.document import Document
from app.models.user import User

router = APIRouter(prefix="/workspaces/{workspace_id}/documents", tags=["Documents"])

@router.post("/")
def upload_document(
    workspace_id: int,
    file: UploadFile = File(...),
    folder_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    member=Depends(require_role("admin", "editor")),   # viewers cannot upload
):
    file_key = f"{workspace_id}/{uuid.uuid4()}_{file.filename}"

    # Measure size BEFORE uploading, while the file is still fully readable
    file.file.seek(0, 2)
    size_bytes = file.file.tell()
    file.file.seek(0)   # rewind back to the start so upload_file can read it fully

    upload_file(
        file.file,
        file_key,
        file.content_type or "application/octet-stream"
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
        "status": doc.status
    }

@router.get("/")
def list_documents(
    workspace_id: int,
    db: Session = Depends(get_db),
    member=Depends(require_role("admin", "editor", "viewer")),
):
    docs = db.query(Document).filter(Document.workspace_id == workspace_id).all()

    return [
        {
            "id": d.id,
            "filename": d.filename,
            "folder_id": d.folder_id,
            "size_bytes": d.size_bytes,
            "status": d.status,
            "created_at": d.created_at
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
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "id": doc.id,
        "filename": doc.filename,
        "download_url": get_download_url(doc.file_key)
    }