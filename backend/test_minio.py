import io
from app.core.storage import upload_file, get_download_url

fake_file = io.BytesIO(b"Hello MinIO, this is a test file.")
upload_file(fake_file, "test/hello.txt", "text/plain")

print("Uploaded! Download link:")
print(get_download_url("test/hello.txt"))