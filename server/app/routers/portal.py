import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.core import get_db
from app.db.models import (
    AccountRequest,
    ClassSubject,
    Enrollment,
    Lesson,
    LessonStatus,
    SchoolClass,
    Student,
    Subject,
    Teacher,
    User,
    UserRole,
)
from app.deps import get_active_user, require_roles
from app.schemas import (
    AccountCreated,
    ClassSubjectCreate,
    StudentCreate,
    SubjectCreate,
    SubjectOut,
)
from app.services.access import ensure_can_manage_class
from app.services.avatars import avatar_url
from app.services.email import send_credentials_email
from app.services.users import create_student

router = APIRouter(tags=["portal"])


def _teacher_view(user: User) -> dict:
    teacher = user.teacher_profile
    return {
        "id": str(user.id),
        "login_id": user.login_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "is_active": user.is_active,
        "avatar_url": avatar_url(user.avatar_public_id, user.avatar_version),
        "last_login_at": user.last_login_at,
        "employee_number": teacher.employee_number if teacher else None,
        "department": teacher.department if teacher else None,
        "qualification": teacher.qualification if teacher else None,
        "phone": teacher.phone_number if teacher else None,
    }


def _student_view(user: User, class_names: list[str]) -> dict:
    student = user.student_profile
    return {
        "id": str(user.id),
        "login_id": user.login_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "is_active": user.is_active,
        "avatar_url": avatar_url(user.avatar_public_id, user.avatar_version),
        "last_login_at": user.last_login_at,
        "admission_number": student.admission_number if student else None,
        "date_of_birth": student.date_of_birth.date().isoformat() if student else None,
        "guardian_name": student.guardian_name if student else None,
        "guardian_email": student.guardian_email if student else None,
        "guardian_phone": student.guardian_phone if student else None,
        "class_names": class_names,
    }


def _class_names_by_student(db: Session, student_ids: list[uuid.UUID]) -> dict[uuid.UUID, list[str]]:
    if not student_ids:
        return {}
    rows = db.execute(
        select(Enrollment.student_id, SchoolClass.name)
        .join(SchoolClass, SchoolClass.id == Enrollment.class_id)
        .where(
            Enrollment.student_id.in_(student_ids),
            Enrollment.withdrawn_at.is_(None),
        )
        .order_by(SchoolClass.name)
    ).all()
    result: dict[uuid.UUID, list[str]] = {}
    for student_id, class_name in rows:
        result.setdefault(student_id, []).append(class_name)
    return result


def _class_subject_view(item: ClassSubject) -> dict:
    teacher = item.teacher.user
    return {
        "id": str(item.id),
        "class_id": str(item.class_id),
        "class_name": item.school_class.name,
        "subject_id": str(item.subject_id),
        "subject_name": item.subject.name,
        "teacher_id": str(item.teacher_id),
        "teacher_name": f"{teacher.first_name} {teacher.last_name}",
    }


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    count = lambda model: db.scalar(select(func.count()).select_from(model)) or 0
    return {
        "teachers": db.scalar(
            select(func.count()).select_from(Teacher).join(User).where(User.is_active)
        ) or 0,
        "students": db.scalar(
            select(func.count()).select_from(Student).join(User).where(User.is_active)
        ) or 0,
        "classes": db.scalar(
            select(func.count()).select_from(SchoolClass).where(SchoolClass.is_active)
        ) or 0,
        "subjects": count(Subject),
        "lessons": count(Lesson),
        "published_lessons": db.scalar(
            select(func.count()).select_from(Lesson).where(Lesson.status == LessonStatus.PUBLISHED)
        ) or 0,
        "pending_requests": db.scalar(
            select(func.count())
            .select_from(AccountRequest)
            .where(AccountRequest.status == "pending")
        ) or 0,
    }


@router.get("/teachers")
def list_teachers(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    users = db.scalars(
        select(User)
        .outerjoin(Teacher, Teacher.user_id == User.id)
        .where(User.role == UserRole.TEACHER)
        .order_by(User.last_name, User.first_name)
    ).all()
    return [_teacher_view(user) for user in users]


@router.get("/students")
def list_students(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
):
    query = select(User).outerjoin(Student, Student.user_id == User.id).where(
        User.role == UserRole.STUDENT
    )
    if user.role == UserRole.TEACHER:
        if not user.teacher_profile:
            return []
        assigned_classes = select(ClassSubject.class_id).where(
            ClassSubject.teacher_id == user.teacher_profile.id
        )
        enrolled_students = select(Enrollment.student_id).where(
            Enrollment.class_id.in_(assigned_classes),
            Enrollment.withdrawn_at.is_(None),
        )
        query = query.where(
            (User.created_by_id == user.id)
            | Student.id.in_(enrolled_students)
        )
    users = db.scalars(query.order_by(User.last_name, User.first_name)).all()
    names = _class_names_by_student(
        db, [user.student_profile.id for user in users if user.student_profile]
    )
    return [
        _student_view(
            item,
            names.get(item.student_profile.id, []) if item.student_profile else [],
        )
        for item in users
    ]


@router.post(
    "/students",
    response_model=AccountCreated,
    status_code=status.HTTP_201_CREATED,
)
def create_student_account(
    payload: StudentCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    creator: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
):
    if payload.class_id is not None:
        ensure_can_manage_class(db, creator, payload.class_id)

    user, temporary_password = create_student(db, payload, created_by=creator)
    if payload.class_id is not None:
        db.add(
            Enrollment(
                class_id=payload.class_id,
                student_id=user.student_profile.id,
            )
        )
        db.commit()
    background.add_task(
        send_credentials_email,
        to=payload.guardian_email,
        recipient_name=payload.guardian_name,
        account_holder=f"{user.first_name} {user.last_name}",
        login_id=user.login_id,
        temp_password=temporary_password,
        role=user.role,
    )
    return AccountCreated(
        user_id=str(user.id),
        login_id=user.login_id,
        credentials_emailed_to=payload.guardian_email,
    )


@router.get("/subjects")
def list_subjects(
    db: Session = Depends(get_db),
    _user: User = Depends(get_active_user),
):
    return db.scalars(select(Subject).order_by(Subject.name)).all()


@router.post(
    "/subjects",
    response_model=SubjectOut,
    status_code=status.HTTP_201_CREATED,
)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    subject = Subject(**payload.model_dump())
    db.add(subject)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Subject code or name already exists",
        )
    db.refresh(subject)
    return subject


@router.get("/class-subjects")
def list_class_subjects(
    db: Session = Depends(get_db),
    user: User = Depends(get_active_user),
):
    query = select(ClassSubject)
    if user.role == UserRole.TEACHER:
        if not user.teacher_profile:
            return []
        query = query.where(ClassSubject.teacher_id == user.teacher_profile.id)
    elif user.role == UserRole.STUDENT:
        if not user.student_profile:
            return []
        enrolled_classes = select(Enrollment.class_id).where(
            Enrollment.student_id == user.student_profile.id,
            Enrollment.withdrawn_at.is_(None),
        )
        query = query.where(ClassSubject.class_id.in_(enrolled_classes))
    assignments = db.scalars(
        query.order_by(ClassSubject.class_id, ClassSubject.subject_id)
    ).all()
    return [_class_subject_view(item) for item in assignments]


@router.post(
    "/class-subjects",
    status_code=status.HTTP_201_CREATED,
)
def create_class_subject(
    payload: ClassSubjectCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    class_id = payload.class_id
    subject_id = payload.subject_id
    school_class = db.get(SchoolClass, class_id)
    if school_class is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Class not found")
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Subject not found")
    teacher = db.scalar(
        select(Teacher)
        .join(User, User.id == Teacher.user_id)
        .where(Teacher.user_id == payload.teacher_id, User.role == UserRole.TEACHER)
    )
    if teacher is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher not found")
    if not teacher.user.is_active:
        raise HTTPException(status.HTTP_409_CONFLICT, "Teacher is inactive")

    assignment = ClassSubject(
        class_id=class_id,
        subject_id=subject_id,
        teacher_id=teacher.id,
    )
    db.add(assignment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "This subject is already assigned for this class",
        )
    db.refresh(assignment)
    return _class_subject_view(assignment)


@router.delete(
    "/class-subjects/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_class_subject(
    assignment_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    assignment = db.get(ClassSubject, assignment_id)
    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assignment not found")
    db.delete(assignment)
    db.commit()


@router.get("/classes/{class_id}")
def get_class_detail(
    class_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
):
    room = ensure_can_manage_class(db, user, class_id)
    students = db.scalars(
        select(User)
        .join(Student, Student.user_id == User.id)
        .join(Enrollment, Enrollment.student_id == Student.id)
        .where(
            Enrollment.class_id == class_id,
            Enrollment.withdrawn_at.is_(None),
        )
        .order_by(User.last_name, User.first_name)
    ).all()
    names = _class_names_by_student(
        db, [student.student_profile.id for student in students if student.student_profile]
    )
    subjects = db.scalars(
        select(ClassSubject)
        .where(ClassSubject.class_id == class_id)
        .order_by(ClassSubject.subject_id)
    ).all()
    return {
        "id": str(room.id),
        "name": room.name,
        "academic_year": room.academic_year,
        "student_count": len(students),
        "subjects": [_class_subject_view(item) for item in subjects],
        "students": [
            _student_view(
                student,
                names.get(student.student_profile.id, []) if student.student_profile else [],
            )
            for student in students
        ],
    }
