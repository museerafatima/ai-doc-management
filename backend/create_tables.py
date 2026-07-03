from app.core.database import engine
from app.models.user import Base

print("Creating tables in PostgreSQL...")
Base.metadata.create_all(bind=engine)
print("Done! Check pgAdmin to see the users table.")