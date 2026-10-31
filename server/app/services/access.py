import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, Select
from sqlalchemy.orm import Session

from app.db.models import (
    ClassSubject, Enrollment, Lesson, LessonStatus, SchoolClass, User, UserRole
)

_forbidden = HTTPException(
    status.HTTP_403_FORBIDDEN,
    "Insufficient Persmissions"
)

def lessons_visible_to(user: User) -> Select:
    """Admins see all the lessons, teachers only see their own, students only see the published lessons"""
    stmt = select(Lesson)
    if user.role == UserRole.ADMIN:
        return stmt

    stmt = stmt.join(ClassSubject, ClassSubject.id == Lesson.class_subject_id)
    if user.role == UserRole.TEACHER:
        if user.teacher_profile is None:
            raise _forbidden
        return stmt.where(ClassSubject.teacher_id == user.teacher_profile.id)

    if user.student_profile is None:
        raise _forbidden
    return (
        stmt.join(Enrollment, Enrollment.class_id == ClassSubject.class_id)
        .where(
            Enrollment.student_id == user.student_profile.id,
            Enrollment.withdrawn_at.is_(None),
            Lesson.status == LessonStatus.PUBLISHED
        )
    )


def classes_visible_to(user: User) -> Select:
    stmt = select(SchoolClass)
    if user.role == UserRole.ADMIN:
        return stmt

    if user.role == UserRole.TEACHER:
        if user.teacher_profile is None:
            raise _forbidden
        return (
            stmt.join(ClassSubject, ClassSubject.class_id == SchoolClass.id)
            .where(ClassSubject.teacher_id == user.teacher_profile.id)
            .distinct()
        )

    if user.student_profile is None:
        raise _forbidden

    return stmt.join(Enrollment, Enrollment.class_id == SchoolClass.id).where(
        Enrollment.student_id == user.student_profile.id,
        Enrollment.withdrawn_at.is_(None)
    )

def get_manageable_class_subject(
        db: Session,
        user: User,
        class_subject_id: uuid.UUID
) -> ClassSubject:
    """The assignment, only if the user is an admin or an assigned teacher"""
    cs = db.get(ClassSubject, class_subject_id)
    if cs is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Class subject not found"
        )

    if user.role == UserRole.TEACHER and (
        user.teacher_profile is None or cs.teacher_id  != user.teacher_profile.id
    ):
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Class Subject not found"
        )

    return cs

def ensure_can_manage_class(
        db: Session,
        user: User,
        class_id: uuid.UUID
) -> SchoolClass:
    """The class only if the user is an admin or teaches in it"""
    school_class = db.get(SchoolClass, class_id)
    if school_class is None:
         raise HTTPException(status.HTTP_404_NOT_FOUND, "Class not found")
    if user.role == UserRole.ADMIN:
        return school_class
    teaches = db.scalar(
        select(ClassSubject.id).where(
            ClassSubject.class_id == class_id,
            ClassSubject.teacher_id == (user.teacher_profile.id if user.teacher_profile else None),
        )
    )
    if teaches is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Class not found")
    return school_class