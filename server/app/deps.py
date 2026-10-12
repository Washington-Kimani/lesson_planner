import uuid
from typing import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.core import get_db
from app.db.models import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


_unauthorized = HTTPException(
    status.HTTP_401_UNAUTHORIZED,
    "Invalid or expired token",
    headers={"WWW-Authenticate": "Bearer"}
)


def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _unauthorized
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise _unauthorized
    return user


def get_active_user(
        user: User = Depends(get_current_user)
) -> User:
    """this blocks any action done before changing the password"""
    if user.must_change_password:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Insufficient permissions"
        )
    return user


def require_roles(*roles: UserRole) -> Callable[..., User]:
    def checker(
            user: User = Depends(get_active_user)
    ) -> User:
        if user.role not in roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Insufficient permissions"
            )
        return user
    return checker