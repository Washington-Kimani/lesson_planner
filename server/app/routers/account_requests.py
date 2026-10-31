import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.core import get_db
from app.db.models import AccountRequest, User, UserRole
from app.deps import require_roles
from app.schemas import TeacherCreate
from app.services.email import send_credentials_email
from app.services.users import create_teacher

router = APIRouter(tags=["account-requests"])

RequestStatus = Literal["pending", "approved", "rejected"]


class AccountRequestIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    subjects: str = Field(min_length=1, max_length=200)
    department: str | None = Field(default=None, max_length=100)
    qualification: str | None = Field(default=None, max_length=150)
    employee_number: str | None = Field(default=None, max_length=50)
    message: str | None = Field(default=None, max_length=1000)


class AccountRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    phone: str
    employee_number: str | None
    department: str | None
    qualification: str | None
    subjects: str | None
    message: str | None
    status: RequestStatus
    created_at: datetime
    reviewed_at: datetime | None
    review_note: str | None


class RejectIn(BaseModel):
    note: str | None = Field(default=None, max_length=500)


_hits: dict[str, deque[float]] = defaultdict(deque)
_limit, _window = 5, 60 * 60


def _rate_limit(request: Request) -> None:
    forwarded = request.headers.get("x-forwarded-for", "")
    client_ip = forwarded.split(",")[0].strip() or (
        request.client.host if request.client else "unknown"
    )
    now = time.monotonic()
    hits = _hits[client_ip]
    while hits and now - hits[0] > _window:
        hits.popleft()
    if len(hits) >= _limit:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS, "Too many requests. Try again later."
        )
    hits.append(now)


@router.post("/account-requests", status_code=status.HTTP_201_CREATED)
def submit_request(
    payload: AccountRequestIn,
    request: Request,
    db: Session = Depends(get_db),
):
    _rate_limit(request)
    email = str(payload.email).lower()
    existing_user = db.scalar(
        select(User.id).where(func.lower(User.email) == email)
    )
    if existing_user or db.scalar(
        select(AccountRequest.id).where(
            AccountRequest.email == email,
            AccountRequest.status == "pending",
        )
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "A request or account already exists for this email.",
        )
    row = AccountRequest(**payload.model_dump(exclude={"email"}), email=email)
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "A request or account already exists for this email.",
        )
    return {"id": str(row.id)}


@router.get("/account-requests", response_model=list[AccountRequestOut])
def list_requests(
    status_filter: RequestStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    query = select(AccountRequest).order_by(AccountRequest.created_at.desc())
    if status_filter:
        query = query.where(AccountRequest.status == status_filter)
    return db.scalars(query).all()


def _pending_or_error(db: Session, request_id: uuid.UUID) -> AccountRequest:
    row = db.get(AccountRequest, request_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found.")
    if row.status != "pending":
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"This request was already {row.status}."
        )
    return row


@router.post(
    "/account-requests/{request_id}/approve",
    response_model=AccountRequestOut,
)
def approve_request(
    request_id: uuid.UUID,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    row = _pending_or_error(db, request_id)
    employee_number = row.employee_number or f"REQ-{row.id.hex[:12].upper()}"
    teacher_payload = TeacherCreate(
        first_name=row.first_name,
        last_name=row.last_name,
        email=row.email,
        employee_number=employee_number,
        department=row.department or "General",
        qualification=row.qualification or "Not specified",
        phone_number=row.phone,
    )
    teacher, temporary_password = create_teacher(db, teacher_payload, created_by=admin)
    background.add_task(
        send_credentials_email,
        to=row.email,
        recipient_name=teacher.first_name,
        account_holder=f"{teacher.first_name} {teacher.last_name}",
        login_id=teacher.login_id,
        temp_password=temporary_password,
        role=teacher.role,
    )
    row.status = "approved"
    row.reviewed_at = datetime.now(timezone.utc)
    row.reviewed_by_id = admin.id
    row.teacher_id = teacher.id
    db.commit()
    db.refresh(row)
    return row


@router.post(
    "/account-requests/{request_id}/reject",
    response_model=AccountRequestOut,
)
def reject_request(
    request_id: uuid.UUID,
    body: RejectIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    row = _pending_or_error(db, request_id)
    row.status = "rejected"
    row.reviewed_at = datetime.now(timezone.utc)
    row.reviewed_by_id = admin.id
    row.review_note = body.note
    db.commit()
    db.refresh(row)
    return row
