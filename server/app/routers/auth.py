from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    DUMMY_HASH,
    as_utc,
    create_access_token,
    hash_password,
    hash_refresh_token,
    new_refresh_token,
    verify_password
)
from app.db.core import get_db
from app.deps import get_current_user
from app.db.models import RefreshToken, User, utc_now
from app.schemas import ChangePasswordRequest, RefreshRequest, TokenResponse, ProfileOut
from app.services.avatars import profile_out

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

def _issue_tokens(db: Session, user: User) -> TokenResponse:
    raw, hashed = new_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hashed,
            expires_at=utc_now() + timedelta(days=settings.refresh_token_days)
        )
    )
    db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=raw,
        must_change_password=user.must_change_password
    )

def _revoke_all(
        db:Session,
        user_id
) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id,  RefreshToken.revoked_at.is_(None))
        .values(revoked_at=utc_now())
    )

# route to login
@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    login_id = form.username.strip().upper()
    user = db.scalar(select(User).where(User.login_id == login_id))

    # always run a hash verification so timing doesn't leak whether the ID exists
    password_ok = verify_password(
        form.password,
        user.password_hash if user else DUMMY_HASH
    )

    if user is None or not password_ok or not user.is_active:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect login ID or password",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )
    user.last_login_at = utc_now()
    return _issue_tokens(db, user)

# route to refresh tokens
@router.post("/refresh", response_model=TokenResponse)
def refresh(
    body: RefreshRequest,
    db: Session = Depends(get_db)
):
    invalid = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    token = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(body.refresh_token)
        )
    )

    if token is None:
        raise invalid

    if token.revoked_at is None:
        # a used token was replayed: assume theft and terminate every session
        _revoke_all(db, token.user_id)
        db.commit()
        raise invalid

    user = db.get(user, token.user_id)
    if as_utc(token.expires_at) < utc_now() or user is None or not user.is_active:
        raise invalid

    token.revoked_at = utc_now()
    return _issue_tokens(db, user)

# router to end session and logout
@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(body: RefreshRequest, db: Session = Depends(get_db)):
    token = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(body.refresh_token)
        )
    )
    if token and token.revoked_at is None:
        token.revoked_at = utc_now()
        db.commit()

# router to change user password
@router.post("/change-password", response_model=TokenResponse)
def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),  # NOT get_active_user: must work while locked
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    if body.current_password == body.new_password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Choose a different password")

    user.password_hash = hash_password(body.new_password)
    user.must_change_password = False
    _revoke_all(db, user.id)  # sign out every other session
    return _issue_tokens(db, user)


# route to get personal profile
@router.get("/me", response_model=ProfileOut)
def me(user: User = Depends(get_current_user)):
    return profile_out(user)