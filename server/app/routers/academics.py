import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.core import get_db
from app.deps import require_roles
from app.db.models import ClassSubject, SchoolClass, Subject, Teacher, User, UserRole
from app.schemas import (
    AssignmentCreate, AssignmentOut, ClassCreate, ClassOut, SubjectCreate, SubjectOut,
)

router = APIRouter(
    prefix="/admin",
    tags=["academics"],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)


def _conflict(message: str) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, message)


@router.post("/subjects", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db)):
    subject = Subject(**payload.model_dump())
    db.add(subject)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Subject code or name already exists")
    return subject


@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db)):
    return db.scalars(select(Subject).order_by(Subject.name)).all()


@router.post("/classes", response_model=ClassOut, status_code=status.HTTP_201_CREATED)
def create_class(payload: ClassCreate, db: Session = Depends(get_db)):
    school_class = SchoolClass(**payload.model_dump())
    db.add(school_class)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("A class with this name already exists for that year")
    return school_class


@router.post(
    "/classes/{class_id}/assignments",
    response_model=AssignmentOut,
    status_code=status.HTTP_201_CREATED,
)
def assign_teacher(
    class_id: uuid.UUID, payload: AssignmentCreate, db: Session = Depends(get_db)
):
    if db.get(SchoolClass, class_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Class not found")
    if db.get(Subject, payload.subject_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Subject not found")

    teacher = db.scalar(
        select(Teacher)
        .join(User, User.id == Teacher.user_id)
        .where(User.login_id == payload.teacher_login_id.strip().upper(), User.is_active)
    )
    if teacher is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher not found")

    assignment = ClassSubject(
        class_id=class_id, subject_id=payload.subject_id, teacher_id=teacher.id
    )
    db.add(assignment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("This subject is already assigned for this class")
    return assignment


@router.get("/classes/{class_id}/assignments", response_model=list[AssignmentOut])
def list_assignments(class_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.scalars(select(ClassSubject).where(ClassSubject.class_id == class_id)).all()