from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
import os
from passlib.context import CryptContext  # bcrypt password hashing
from pydantic import BaseModel  # validates incoming data
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "fallback")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# bcrypt: the secure password hashing method (mentioned in project doc)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Pydantic models
class RegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# Routes
@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Step 1: Does this email already exist?
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Step 2: Hash the password with bcrypt — NEVER save plain text
    hashed = pwd_context.hash(data.password)

    # Step 3: Create and save user to PostgreSQL
    new_user = User(
        email=data.email, full_name=data.full_name, hashed_password=hashed
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # gets the auto-generated id

    return {"message": "Account created!", "user_id": new_user.id}


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # 1. Find user in PostgreSQL by email
    user = db.query(User).filter(User.email == data.email).first()

    # 2. Verify the password against the stored bcrypt hash
    if not user or not pwd_context.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Wrong email or password")

    # 3. Create a JWT token — expires in 60 minutes
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(minutes=EXPIRE_MIN),
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": user.full_name,
    }