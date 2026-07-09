from app.models.user import Base
from app.core.database import engine
from app.models import user, workspace, document, folder  # import every model file so their tables register
 
Base.metadata.create_all(bind=engine)
print("Tables created (or already existed).")