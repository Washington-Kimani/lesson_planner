"use client";

import { CalendarDays, Clock, UserRound } from "lucide-react";

import { Modal } from "@/app/components/Modal";
import { endTime, formatDuration, formatLongDate } from "@/lib/dates";
import { api } from "@/lib/client";
import { useAction } from "@/lib/useAction";
import type { Lesson } from "@/lib/types";

export function LessonDetail({ lesson, canEdit, onEdit, onClose }: {
    lesson: Lesson;
    canEdit: boolean;
    onEdit: () => void;
    onClose: () => void;
}) {
    const { run, busy, error } = useAction();
    const start = lesson.start_time.slice(0, 5);
    const published = lesson.status === "published";
    const blocks: [string, string | null][] = [
        ["Objectives", lesson.objectives],
        ["Lesson plan", lesson.content],
        ["Materials", lesson.materials],
        ["Homework", lesson.homework],
    ];

    function togglePublished() {
        run("publish", () => api(`/lessons/${lesson.id}/${published ? "unpublish" : "publish"}`, { method: "POST" }), onClose);
    }

    return (
        <Modal title={lesson.title} onClose={onClose} wide>
            <div className="flex flex-wrap items-center gap-2">
                <span className="badge">{lesson.subject_name}</span>
                <span className="badge badge-muted">{lesson.class_name}</span>
                {canEdit && <span className={`badge ${published ? "badge-success" : "badge-warn"}`}>{published ? "Published" : "Draft"}</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-body">
                <span className="flex items-center gap-2"><CalendarDays size={15} className="text-muted" />{formatLongDate(lesson.lesson_date)}</span>
                <span className="flex items-center gap-2"><Clock size={15} className="text-muted" />{start} – {endTime(start, lesson.duration_minutes)} ({formatDuration(lesson.duration_minutes)})</span>
                {lesson.teacher_name && <span className="flex items-center gap-2"><UserRound size={15} className="text-muted" />{lesson.teacher_name}</span>}
            </div>
            {blocks.map(([label, text]) => text && (
                <div className="detail-block" key={label}><h4>{label}</h4><p>{text}</p></div>
            ))}
            {blocks.every(([, text]) => !text) && <p className="empty mt-5">No lesson details have been added yet.</p>}
            {error && <p className="alert mt-4" role="alert">{error}</p>}
            {canEdit && (
                <div className="form-actions">
                    <button type="button" className="btn" disabled={busy !== null} onClick={togglePublished}>
                        {busy === "publish" ? "Updating…" : published ? "Unpublish" : "Publish to students"}
                    </button>
                    <button type="button" className="btn btn-primary" onClick={onEdit}>Edit lesson</button>
                </div>
            )}
        </Modal>
    );
}
