import asyncio
from io import BytesIO

from minio import Minio

from app.config import get_settings


class RawObjectStore:
    def __init__(self) -> None:
        settings = get_settings()
        self.bucket = settings.minio_raw_bucket
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )

    def _put(self, key: str, data: bytes, content_type: str) -> None:
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)
        self.client.put_object(self.bucket, key, BytesIO(data), len(data), content_type=content_type)

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        await asyncio.to_thread(self._put, key, data, content_type)
