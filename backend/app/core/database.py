import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()  # reads your .env file

DATABASE_URL = os.getenv("DATABASE_URL")

# create_engine = one connection pool to PostgreSQL
engine = create_engine(DATABASE_URL)

# Each API request gets its own fresh session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# FastAPI calls this to get a database session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()