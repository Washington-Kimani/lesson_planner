export type LessonStatus = "draft" | "published";

// Mirrors the FastAPI LessonOut schema
export interface Lesson {
    id: string;
    class_subject_id: string;
    title: string;
    objectives: string | null;
    content: string | null;
    materials: string | null;
    homework: string | null;
    lesson_date: string; // "2026-10-20"
    start_time: string; // "09:00:00"
    duration_minutes: number;
    status: LessonStatus;
    subject_name: string;
    class_name: string;
    teacher_name?: string | null;
}

export interface LessonInput {
    class_subject_id: string;
    title: string;
    objectives: string | null;
    content: string | null;
    materials: string | null;
    homework: string | null;
    lesson_date: string;
    start_time: string; // "HH:MM"
    duration_minutes: number;
    status: LessonStatus;
}

export interface Subject {
    id: string;
    name: string;
    code: string | null;
}

export interface ClassRoom {
    id: string;
    name: string;
    academic_year: string;
    student_count: number;
}

/** A teaching assignment: this teacher teaches this subject to this class. */
export interface ClassSubject {
    id: string;
    class_id: string;
    class_name: string;
    subject_id: string;
    subject_name: string;
    teacher_id: string;
    teacher_name: string;
}

interface Person {
    id: string;
    login_id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    is_active: boolean;
    avatar_url: string | null;
    last_login_at: string | null;
}

export interface Teacher extends Person {
    employee_number: string | null;
    department: string | null;
    qualification: string | null;
    phone: string | null;
}

export interface Student extends Person {
    admission_number: string | null;
    date_of_birth: string | null; // "2012-05-30"
    guardian_name: string | null;
    guardian_email: string | null;
    guardian_phone: string | null;
    class_names: string[];
}

export interface ClassDetail extends ClassRoom {
    subjects: ClassSubject[];
    students: Student[];
}

export type RequestStatus = "pending" | "approved" | "rejected";

export interface AccountRequest {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    employee_number: string | null;
    department: string | null;
    qualification: string | null;
    subjects: string | null;
    message: string | null;
    status: RequestStatus;
    created_at: string;
    reviewed_at: string | null;
    review_note: string | null;
}

export interface AdminStats {
    teachers: number;
    students: number;
    classes: number;
    subjects: number;
    lessons: number;
    published_lessons: number;
    pending_requests: number;
}
