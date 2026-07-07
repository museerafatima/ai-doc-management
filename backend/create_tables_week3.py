from app.core.database import engine
from app.models.user import Base
import app.models.workspace
import app.models.folder      # build this file on Day 3 before running this script
import app.models.document

print("Creating Week 3 tables in PostgreSQL...")
Base.metadata.create_all(bind=engine)
print("Done! Check pgAdmin for the folders and documents tables.")