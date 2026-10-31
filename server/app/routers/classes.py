import uuid
from datetime import timedelta  # noqa: F401  (not needed; remove if linting)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.core import get_db
from app.deps import get_active_user, require_roles
from app.db.models import Enrollment, Student, User, UserRole, SchoolClass, utc_now
from app.schemas import ClassCreate, ClassOut, EnrollRequest, RosterEntry
from app.services.access import classes_visible_to, ensure_can_manage_class

router = APIRouter(prefix="/classes", tags=["classes"])

_staff = require_roles(UserRole.ADMIN, UserRole.TEACHER)


@router.post("", response_model=ClassOut, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: ClassCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    school_class = SchoolClass(**payload.model_dump())
    db.add(school_class)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "A class with this name already exists for that year",
        )
    db.refresh(school_class)
    return school_class


@router.get("", response_model=list[ClassOut])
def list_classes(user: User = Depends(get_active_user), db: Session = Depends(get_db)):
    rooms = db.scalars(classes_visible_to(user).order_by(SchoolClass.name)).all()
    return [
        {
            "id": room.id,
            "name": room.name,
            "academic_year": room.academic_year,
            "is_active": room.is_active,
            "student_count": db.scalar(
                select(func.count())
                .select_from(Enrollment)
                .where(
                    Enrollment.class_id == room.id,
                    Enrollment.withdrawn_at.is_(None),
                )
            ) or 0,
        }
        for room in rooms
    ]


@router.get("/{class_id}/students", response_model=list[RosterEntry])
def roster(
    class_id: uuid.UUID, user: User = Depends(_staff), db: Session = Depends(get_db)
):
    ensure_can_manage_class(db, user, class_id)
    rows = db.execute(
        select(User.login_id, User.first_name, User.last_name, Student.admission_number)
        .join(Student, Student.user_id == User.id)
        .join(Enrollment, Enrollment.student_id == Student.id)
        .where(Enrollment.class_id == class_id, Enrollment.withdrawn_at.is_(None))
        .order_by(User.last_name, User.first_name)
    ).all()
    return [RosterEntry(**row._asdict()) for row in rows]


def _find_student(db: Session, student_id: uuid.UUID) -> Student:
    student = db.scalar(
        select(Student)
        .join(User, User.id == Student.user_id)
        .where(User.id == student_id, User.is_active)
    )
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    return student


@router.post("/{class_id}/students", status_code=status.HTTP_204_NO_CONTENT)
def enroll_student(
    class_id: uuid.UUID,
    body: EnrollRequest,
    user: User = Depends(_staff),
    db: Session = Depends(get_db),
):
    ensure_can_manage_class(db, user, class_id)
    student = _find_student(db, body.student_id)

    existing = db.scalar(
        select(Enrollment).where(
            Enrollment.class_id == class_id, Enrollment.student_id == student.id
        )
    )
    if existing is not None:
        if existing.withdrawn_at is None:
            raise HTTPException(status.HTTP_409_CONFLICT, "Student is already enrolled")
        existing.withdrawn_at = None  # re-enrol a previously withdrawn student
        existing.enrolled_at = utc_now()
    else:
        db.add(Enrollment(class_id=class_id, student_id=student.id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Student is already enrolled")


@router.delete("/{class_id}/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_student(
    class_id: uuid.UUID,
    student_id: uuid.UUID,
    user: User = Depends(_staff),
    db: Session = Depends(get_db),
):
    ensure_can_manage_class(db, user, class_id)
    student = _find_student(db, student_id)
    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.class_id == class_id,
            Enrollment.student_id == student.id,
            Enrollment.withdrawn_at.is_(None),
        )
    )
    if enrollment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enrollment not found")
    enrollment.withdrawn_at = utc_now()
    db.commit()