import uuid
from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.db.models import LessonStatus, UserRole


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    must_change_password: bool


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=10, max_length=128)


class TeacherCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    employee_number: str
    department: str
    qualification: str
    phone_number: str


class StudentCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    admission_number: str
    date_of_birth: date
    guardian_name: str
    guardian_email: EmailStr
    guardian_phone: str


class AccountCreated(BaseModel):
    user_id: str
    login_id: str
    credentials_emailed_to: str

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SubjectCreate(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None


class SubjectOut(ORMModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str]


class ClassCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    academic_year: str = Field(min_length=4, max_length=9)


class ClassOut(ORMModel):
    id: uuid.UUID
    name: str
    academic_year: str
    is_active: bool


class AssignmentCreate(BaseModel):
    subject_id: uuid.UUID
    teacher_login_id: str  # e.g. TCH-AB12-CD34


class AssignmentOut(ORMModel):
    id: uuid.UUID
    class_id: uuid.UUID
    subject_id: uuid.UUID
    teacher_id: uuid.UUID


class EnrollRequest(BaseModel):
    student_login_id: str  # e.g. STU-AB12-CD34


class RosterEntry(BaseModel):
    login_id: str
    first_name: str
    last_name: str
    admission_number: str


class LessonCreate(BaseModel):
    class_subject_id: uuid.UUID
    title: str = Field(min_length=1, max_length=200)
    objectives: Optional[str] = None
    content: Optional[str] = None
    materials: Optional[str] = None
    homework: Optional[str] = None
    lesson_date: date
    duration_minutes: int = Field(default=40, ge=5, le=480)
    status: LessonStatus = LessonStatus.DRAFT


class LessonUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    objectives: Optional[str] = None
    content: Optional[str] = None
    materials: Optional[str] = None
    homework: Optional[str] = None
    lesson_date: Optional[date] = None
    duration_minutes: Optional[int] = Field(default=None, ge=5, le=480)
    status: Optional[LessonStatus] = None


class LessonOut(ORMModel):
    id: uuid.UUID
    class_subject_id: uuid.UUID
    title: str
    objectives: Optional[str]
    content: Optional[str]
    materials: Optional[str]
    homework: Optional[str]
    lesson_date: date
    duration_minutes: int
    status: LessonStatus


class ProfileUpdate(BaseModel):
    # only these fields will be editted
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True
    )

    first_name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100
    )
    last_name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100
    )

class ProfileOut(BaseModel):
    id: str
    login_id: str
    first_name: str
    last_name: str
    email: Optional[str]
    role: UserRole
    must_change_password: bool
    avatar_url: Optional[str]