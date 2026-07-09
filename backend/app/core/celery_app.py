import os
from dotenv import load_dotenv
from celery import Celery

load_dotenv()  # reads backend/.env

REDIS_URL = os.getenv("REDIS_URL")

celery_app = Celery(
    "docuflow",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
)