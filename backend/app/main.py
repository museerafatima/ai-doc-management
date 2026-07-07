from app.api import auth, workspaces, documents
from app.api import auth, workspaces
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router

app = FastAPI(title="AI Doc Management API")

# Allow Next.js frontend (port 3000) to call this backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {"status": "AI Doc Management API is running"}
app.include_router(workspaces.router)
app.include_router(documents.router)