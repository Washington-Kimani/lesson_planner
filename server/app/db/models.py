import os
import uuid
import enum
from datetime import datetime, time, timezone
from typing import Optional
from sqlalchemy import ForeignKey, Boolean, Date, DateTime, Enum as SQLEnum, String, Text, Integer, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.core import Base

# HELPERS
def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# ENUMS
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class LessonStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"

# USER MODEL
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4
    )

    login_id: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[Optional[str]] = mapped_column(
        String(320),
        unique=True,
        index=True
    )

    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, values_callable=lambda e: [m.value for m in e]),
        index=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255)
    )

    must_change_password: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )

    avatar_public_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    avatar_version: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now
    )

    # relationships
    teacher_profile: Mapped[Optional["Teacher"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False
    )

    student_profile: Mapped[Optional["Student"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False
    )

# TEACHER MODEL
class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True
    )

    employee_number: Mapped[str] = mapped_column(
        String(100),
        unique=True
    )

    department: Mapped[str] = mapped_column(
        String(50)
    )

    qualification: Mapped[str] = mapped_column(
        String(100)
    )

    phone_number: Mapped[str] = mapped_column(
        String(50)
    )

    user: Mapped["User"] = relationship(
        back_populates="teacher_profile"
    )

# STUDENT MODEL
class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    admission_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True
    )

    date_of_birth: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    guardian_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    guardian_email: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )

    guardian_phone: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    user: Mapped["User"] = relationship(
        back_populates="student_profile"
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True
    )

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AccountRequest(Base):
    __tablename__ = "account_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(80), nullable=False)
    last_name: Mapped[str] = mapped_column(String(80), nullable=False)
    email: Mapped[str] = mapped_column(String(254), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    employee_number: Mapped[Optional[str]] = mapped_column(String(50))
    department: Mapped[Optional[str]] = mapped_column(String(100))
    qualification: Mapped[Optional[str]] = mapped_column(String(150))
    subjects: Mapped[Optional[str]] = mapped_column(String(200))
    message: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(10), default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    reviewed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    review_note: Mapped[Optional[str]] = mapped_column(String(500))
    teacher_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )


#  SUBJECT MODEL
class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    code: Mapped[str] = mapped_column(
        String(20),
        unique=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True
    )

    description: Mapped[Optional[str]] = mapped_column(Text)


# SCHOOL CLASS MODEL
class SchoolClass(Base):
    __tablename__ = "classes"
    __table_args__ = (UniqueConstraint("name", "academic_year"),)

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(
        String(100)
    )

    academic_year: Mapped[str] = mapped_column(
        String(9)
    )  # "2026" or "2026/2027"

    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    assignments: Mapped[list["ClassSubject"]] = relationship(
        back_populates="school_class", cascade="all, delete-orphan"
    )

    enrollments: Mapped[list["Enrollment"]] = relationship(
        back_populates="school_class", cascade="all, delete-orphan"
    )


# CLASS SUBJECT MODEL
class ClassSubject(Base):
    __tablename__ = "class_subjects"
    __table_args__ = (UniqueConstraint("class_id", "subject_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    class_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("classes.id", ondelete="CASCADE"), index=True
    )

    subject_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subjects.id", ondelete="RESTRICT")
    )

    teacher_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("teachers.id", ondelete="RESTRICT"), index=True
    )

    school_class: Mapped["SchoolClass"] = relationship(
        back_populates="assignments"
    )

    subject: Mapped["Subject"] = relationship()

    teacher: Mapped["Teacher"] = relationship()

    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="class_subject", cascade="all, delete-orphan"
    )

# ENROLLMENT MODEL
class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("class_id", "student_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    class_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("classes.id", ondelete="CASCADE"), index=True
    )

    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), index=True
    )

    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    withdrawn_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    school_class: Mapped["SchoolClass"] = relationship(back_populates="enrollments")
    student: Mapped["Student"] = relationship()


# LESSONS MODEL
class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    class_subject_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("class_subjects.id", ondelete="CASCADE"), index=True
    )

    title: Mapped[str] = mapped_column(
        String(200)
    )

    objectives: Mapped[Optional[str]] = mapped_column(Text)

    content: Mapped[Optional[str]] = mapped_column(Text)

    materials: Mapped[Optional[str]] = mapped_column(Text)

    homework: Mapped[Optional[str]] = mapped_column(Text)

    lesson_date: Mapped[Date] = mapped_column(Date, index=True)

    start_time: Mapped[time] = mapped_column(Time, default=time(9), nullable=False)
    
    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=40
    )

    status: Mapped[LessonStatus] = mapped_column(
        SQLEnum(LessonStatus, values_callable=lambda e: [m.value for m in e]),
        default=LessonStatus.DRAFT,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    class_subject: Mapped["ClassSubject"] = relationship(back_populates="lessons")

    @property
    def class_name(self) -> str:
        return self.class_subject.school_class.name

    @property
    def subject_name(self) -> str:
        return self.class_subject.subject.name

    @property
    def teacher_name(self) -> str:
        user = self.class_subject.teacher.user
        return f"{user.first_name} {user.last_name}"