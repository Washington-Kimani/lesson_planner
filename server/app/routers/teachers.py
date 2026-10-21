from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.db.core import get_db
from app.deps import require_roles
from app.db.models import User, UserRole
from app.schemas import AccountCreated, StudentCreate
from app.services.email import send_credentials_email
from app.services.users import create_student

router = APIRouter(prefix="/teachers", tags=["teachers"])


# route for teachers to create a new student account
@router.post("/students", response_model=AccountCreated, status_code=status.HTTP_201_CREATED)
def create_student_account(
    payload: StudentCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    creator: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    user, temp_password = create_student(db, payload, created_by=creator)
    # Credentials go to the guardian: students may not have their own email
    background.add_task(
        send_credentials_email,
        to=payload.guardian_email,
        recipient_name=payload.guardian_name,
        account_holder=f"{user.first_name} {user.last_name}",
        login_id=user.login_id,
        temp_password=temp_password,
        role=user.role,
    )
    return AccountCreated(
        user_id=str(user.id),
        login_id=user.login_id,
        credentials_emailed_to=payload.guardian_email,
    )