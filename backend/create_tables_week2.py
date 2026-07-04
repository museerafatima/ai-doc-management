from app.core.database import engine
from app.models.user import Base
import app.models.workspace  # Importing registers Workspace + WorkspaceMember on Base


print("Creating Week 2 tables in PostgreSQL...")

Base.metadata.create_all(bind=engine)

print("Done! Check pgAdmin for workspaces and workspace_members tables.")