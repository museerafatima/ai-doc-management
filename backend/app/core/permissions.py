# app/core/permissions.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import os

from app.core.database import get_db
from app.models.user import User

SECRET_KEY = os.getenv("SECRET_KEY", "fallback")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

bearer_scheme = HTTPBearer()  # this is what makes the 🔒 Authorize button work

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
from app.models.workspace import WorkspaceMember

def require_role(*allowed_roles: str):
    # Returns a dependency function FastAPI can call for a given workspace_id
    def checker(
        workspace_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> WorkspaceMember:
        member = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == current_user.id)
            .first()
        )
        if not member:
            raise HTTPException(status_code=403, detail="You are not a member of this workspace")
        if member.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"This action requires role: {' or '.join(allowed_roles)}",
            )
        return member
    return checker