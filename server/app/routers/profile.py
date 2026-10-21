import logging

from fastapi import HTTPException, status, APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.db.core import get_db
from app.deps import get_active_user
from app.db.models import User
from app.schemas import ProfileOut, ProfileUpdate
from app.services.avatars import (
    MAX_AVATAR_BYTES, delete_avatar, looks_like_image, profile_out, upload_avatar
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users/me", tags=["profile"])

@router.patch("", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_active_user),
    db: Session = Depends(get_db)
):
    # exclude_none: an explicit null can't blank a required column
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    return profile_out(user)

@router.put("/avatar", response_model=ProfileOut)
def set_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    # Read one byte past the limit so oversized files are detected without loading them fully
    data = file.file.read(MAX_AVATAR_BYTES + 1)
    if len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "Image must be 2 MB or smaller")
    if not looks_like_image(data):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Upload a JPEG, PNG or WebP image")

    try:
        public_id, version = upload_avatar(user.id, data)
    except Exception:
        logger.exception("Avatar upload failed for user %s", user.id)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not upload the image, try again")

    user.avatar_public_id = public_id
    user.avatar_version = version
    db.commit()
    return profile_out(user)


@router.delete("/avatar", status_code=status.HTTP_204_NO_CONTENT)
def remove_avatar(
    user: User = Depends(get_active_user), db: Session = Depends(get_db)
):
    public_id = user.avatar_public_id
    if public_id is None:
        return
    # Clear the DB first: a failed Cloudinary delete leaves a harmless orphan,
    # whereas the reverse order could leave a DB row pointing at nothing.
    user.avatar_public_id = None
    user.avatar_version = None
    db.commit()
    delete_avatar(public_id)