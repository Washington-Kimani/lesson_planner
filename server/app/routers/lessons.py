import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.core import get_db
from app.deps import require_roles
from app.db.models import Lesson, User, UserRole
from app.schemas import LessonCreate, LessonOut, LessonUpdate
from app.services.access import get_manageable_class_subject, lessons_visible_to

router = APIRouter(prefix="/lessons", tags=["lessons"])

_anyone = require_roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
_staff = require_roles(UserRole.ADMIN, UserRole.TEACHER)


def _get_visible(db: Session, user: User, lesson_id: uuid.UUID) -> Lesson:
    lesson = db.scalar(lessons_visible_to(user).where(Lesson.id == lesson_id))
    if lesson is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lesson not found")
    return lesson


@router.get("", response_model=list[LessonOut])
def list_lessons(
    class_subject_id: Optional[uuid.UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(_anyone),
    db: Session = Depends(get_db),
):
    stmt = lessons_visible_to(user)
    if class_subject_id:
        stmt = stmt.where(Lesson.class_subject_id == class_subject_id)
    if date_from:
        stmt = stmt.where(Lesson.lesson_date >= date_from)
    if date_to:
        stmt = stmt.where(Lesson.lesson_date <= date_to)
    stmt = stmt.order_by(Lesson.lesson_date, Lesson.created_at).limit(limit).offset(offset)
    return db.scalars(stmt).all()


@router.get("/{lesson_id}", response_model=LessonOut)
def get_lesson(
    lesson_id: uuid.UUID, user: User = Depends(_anyone), db: Session = Depends(get_db)
):
    return _get_visible(db, user, lesson_id)


@router.post("", response_model=LessonOut, status_code=status.HTTP_201_CREATED)
def create_lesson(
    payload: LessonCreate, user: User = Depends(_staff), db: Session = Depends(get_db)
):
    # Teachers can only plan lessons for their own assignments
    get_manageable_class_subject(db, user, payload.class_subject_id)
    lesson = Lesson(**payload.model_dump())
    db.add(lesson)
    db.commit()
    return lesson


@router.patch("/{lesson_id}", response_model=LessonOut)
def update_lesson(
    lesson_id: uuid.UUID,
    payload: LessonUpdate,
    user: User = Depends(_staff),
    db: Session = Depends(get_db),
):
    lesson = _get_visible(db, user, lesson_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    db.commit()
    return lesson


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
    lesson_id: uuid.UUID, user: User = Depends(_staff), db: Session = Depends(get_db)
):
    db.delete(_get_visible(db, user, lesson_id))
    db.commit()