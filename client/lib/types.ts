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
}