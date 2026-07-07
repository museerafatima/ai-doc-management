from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from datetime import datetime
from app.models.user import Base   # same shared Base as every other model

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    filename = Column(String, nullable=False)          # original name, e.g. "Contract.pdf"
    file_key = Column(String, nullable=False, unique=True)  # where it lives inside MinIO
    content_type = Column(String, nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    status = Column(String, default="ready")           # "ready" for now — Week 4 adds "processing"/"failed"
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)