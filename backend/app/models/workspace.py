from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

# Reuse the SAME Base as user.py — required so create_tables.py sees both
from app.models.user import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)  # URL-safe ID, e.g. "acme-legal"
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(
        String,
        nullable=False,
        default="viewer"
    )  # "admin" | "editor" | "viewer"
    joined_at = Column(DateTime, default=datetime.utcnow)

import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime

class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, default=lambda: str(uuid.uuid4()))
    status = Column(String, default="pending")  # "pending" | "accepted"
    created_at = Column(DateTime, default=datetime.utcnow)
