from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.db.core import get_db
from app.deps import require_roles
from app.db.models import User, UserRole
from app.schemas import AccountCreated, TeacherCreate
from app.services.email import send_credentials_email
from app.services.users import create_teacher

router = APIRouter(prefix="/admin", tags=["admin"])

# route to create a teacher's account
@router.post("/teachers", response_model=AccountCreated, status_code=status.HTTP_201_CREATED)
def create_teacher_account(
    payload: TeacherCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    user, temp_password = create_teacher(db, payload, created_by=admin)
    background.add_task(
        send_credentials_email,
        to=payload.email,
        recipient_name=user.first_name,
        account_holder=f"{user.first_name} {user.last_name}",
        login_id=user.login_id,
        temp_password=temp_password,
    )
    return AccountCreated(
        user_id=str(user.id), login_id=user.login_id, credentials_emailed_to=payload.email
    )