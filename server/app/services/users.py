import secrets
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import Student, Teacher, User, UserRole
from app.schemas import StudentCreate, TeacherCreate

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
PREFIXES = {
    UserRole.TEACHER: "TCH",
    UserRole.STUDENT: "STU",
    UserRole.ADMIN: "ADM"
}

def generate_user_id(prefix: str) -> str:
    random_part = "".join(secrets.choice(ALPHABET) for _ in range(8))
    return f"{prefix}-{random_part[:4]}-{random_part[4:]}"


def generate_temp_password(length: int = 12) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(length))


def unique_login_id(db: Session, role: UserRole) -> str:
    for _ in range(10):
        candidate = generate_user_id(PREFIXES[role])
        if db.scalar(select(User.id).where(User.login_id == candidate)) is None:
            return candidate
    raise RuntimeError("Could not generate a unique login ID")


def _conflict() -> HTTPException:
    return HTTPException(
        status.HTTP_409_CONFLICT,
        "Email, employee number or admission number already exists"
    )


# function to create a teacher
def create_teacher(
        db: Session,
        data: TeacherCreate,
        created_by: User
) -> tuple[User, str]:
    temp_password = generate_temp_password()
    user = User(
        login_id=unique_login_id(db, UserRole.TEACHER),
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        role=UserRole.TEACHER,
        password_hash=hash_password(temp_password),
        must_change_password=True,
        created_by_id=created_by.id,
        teacher_profile=Teacher(
            employee_number=data.employee_number,
            department=data.department,
            qualification=data.qualification,
            phone_number=data.phone_number
        ),
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict()
    return user, temp_password


# the function to create a student
def create_student(
        db: Session,
        data:StudentCreate,
        created_by: User
) -> tuple[User, str]:
    temp_password = generate_temp_password()
    user = User(
        login_id=unique_login_id(db, UserRole.STUDENT),
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        role=UserRole.STUDENT,
        password_hash=hash_password(temp_password),
        must_change_password=True,
        created_by_id=created_by.id,
        student_profile=Student(
            admission_number=data.admission_number,
            date_of_birth=data.date_of_birth,
            guardian_name=data.guardian_name,
            guardian_email=data.guardian_email,
            guardian_phone=data.guardian_phone,
        ),
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict()
    return user, temp_password