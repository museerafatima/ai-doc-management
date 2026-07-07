import os
import boto3
from dotenv import load_dotenv

load_dotenv()

s3_client = boto3.client(
    "s3",
    endpoint_url=os.getenv("MINIO_ENDPOINT"),
    aws_access_key_id=os.getenv("MINIO_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("MINIO_SECRET_KEY"),
)
BUCKET = os.getenv("MINIO_BUCKET", "documents")

def upload_file(file_obj, key: str, content_type: str):
    s3_client.upload_fileobj(
        file_obj, 
        BUCKET, 
        key, 
        ExtraArgs={"ContentType": content_type}
    )

def get_download_url(key: str, expires_in: int = 3600) -> str:
    # A presigned URL — a temporary, secure link that expires (default 1 hour)
    return s3_client.generate_presigned_url(
        "get_object", 
        Params={"Bucket": BUCKET, "Key": key}, 
        ExpiresIn=expires_in
    )