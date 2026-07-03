from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"  # -> becomes table name in PostgreSQL

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)  # never store plain text
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)