import uuid
import io
import logging

import cloudinary
import cloudinary.uploader
import cloudinary.utils

from typing import Optional

from app.core.config import settings
from app.db.models import User
from app.schemas import ProfileOut

logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret
)

AVATAR_FOLDER = "server/avatars"
MAX_AVATAR_BYTES = 2*1024*1024

def looks_like_image(data: bytes) -> bool:
    """Checks the file signature. The client's Content-Type can't be trusted."""
    return (
        data.startswith(b"\xff\xd8\xff")  # JPEG
        or data.startswith(b"\x89PNG\r\n\x1a\n")  # PNG
        or (data[:4] == b"RIFF" and data[8:12] == b"WEBP")  # WebP
    )

def upload_avatar(user_id: uuid.UUID, data: bytes) -> tuple[str, int]:
    """Uploads (or overwrites) the user's avatar. Returns (public_id, version)."""
    result = cloudinary.uploader.upload(
        io.BytesIO(data),
        public_id=f"{AVATAR_FOLDER}/{user_id}",  # one slot per user: overwrite, never orphan
        resource_type="image",
        type="authenticated",  # only reachable through URLs signed by this server
        overwrite=True,
        invalidate=True,
        allowed_formats=["jpg", "png", "webp"],
        # Incoming transformation: only the 512px square is stored
        transformation=[
            {"width": 512, "height": 512, "crop": "fill", "gravity": "face"}
        ],
    )
    return result["public_id"], result["version"]


def delete_avatar(public_id: str) -> None:
    try:
        cloudinary.uploader.destroy(public_id, type="authenticated", invalidate=True)
    except Exception:
        # Same approach as email: log, never fail the request over cleanup
        logger.exception("Failed to delete avatar %s", public_id)


def avatar_url(
    public_id: Optional[str], version: Optional[int], size: int = 256
) -> Optional[str]:
    if not public_id:
        return None
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        type="authenticated",
        sign_url=True,
        secure=True,
        version=version,  # cache-buster when the picture is replaced
        transformation=[
            {
                "width": size,
                "height": size,
                "crop": "fill",
                "gravity": "face",
                "fetch_format": "auto",
                "quality": "auto",
            }
        ],
    )
    return url


def profile_out(user: User) -> ProfileOut:
    return ProfileOut(
        id=str(user.id),
        login_id=user.login_id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role=user.role,
        must_change_password=user.must_change_password,
        avatar_url=avatar_url(user.avatar_public_id, user.avatar_version),
    )