"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { LessonDetail } from "@/app/components/LessonDetail";
import { LessonForm } from "@/app/components/LessonForm";
import { endTime, formatShortDate, subjectColor } from "@/lib/dates";
import { api } from "@/lib/client";
import { useAction } from "@/lib/useAction";
import type { ClassSubject, Lesson } from "@/lib/types";

export function LessonsList({ lessons, canEdit, showTeacher, classSubjects = [], emptyText }: {
    lessons: Lesson[];
    canEdit: boolean;
    showTeacher?: boolean;
    classSubjects?: ClassSubject[];
    emptyText?: string;
}) {
    const { run, busy, error } = useAction();
    const [viewing, setViewing] = useState<Lesson | null>(null);
    const [editing, setEditing] = useState<Lesson | null>(null);

    if (lessons.length === 0) return <p className="empty">{emptyText ?? "No lessons match."}</p>;

    return (
        <>
            {error && <p className="alert mb-3" role="alert">{error}</p>}
            <div className="glass table-wrap rounded-2xl">
                <table className="table">
                    <thead>
                        <tr>
                            <th>When</th><th>Lesson</th><th>Class</th>{showTeacher && <th>Teacher</th>}{canEdit && <th>Status</th>}{canEdit && <th aria-label="Actions" />}
                        </tr>
                    </thead>
                    <tbody>
                        {lessons.map((lesson) => {
                            const start = lesson.start_time.slice(0, 5);
                            const published = lesson.status === "published";
                            return (
                                <tr key={lesson.id}>
                                    <td className="whitespace-nowrap">
                                        <div className="cell-main">{formatShortDate(lesson.lesson_date)}</div>
                                        <div className="cell-sub">{start} – {endTime(start, lesson.duration_minutes)}</div>
                                    </td>
                                    <td>
                                        <button type="button" onClick={() => setViewing(lesson)} className="flex items-center gap-2 border-0 bg-transparent p-0 text-left">
                                            <i className="block h-8 w-1 shrink-0 rounded-full" style={{ background: subjectColor(lesson.subject_name) }} />
                                            <span>
                                                <span className="cell-main block hover:text-accent-text">{lesson.title}</span>
                                                <span className="cell-sub">{lesson.subject_name}</span>
                                            </span>
                                        </button>
                                    </td>
                                    <td>{lesson.class_name}</td>
                                    {showTeacher && <td>{lesson.teacher_name ?? "—"}</td>}
                                    {canEdit && <td><span className={`badge ${published ? "badge-success" : "badge-warn"}`}>{published ? "Published" : "Draft"}</span></td>}
                                    {canEdit && (
                                        <td>
                                            <div className="row-actions">
                                                <button type="button" className="btn btn-sm" disabled={busy !== null}
                                                        onClick={() => run(lesson.id, () => api(`/lessons/${lesson.id}/${published ? "unpublish" : "publish"}`, { method: "POST" }))}>
                                                    {busy === lesson.id ? "…" : published ? "Unpublish" : "Publish"}
                                                </button>
                                                <button type="button" className="btn btn-sm" aria-label={`Edit ${lesson.title}`} onClick={() => setEditing(lesson)}><Pencil size={14} /></button>
                                                <button type="button" className="btn btn-sm btn-danger" aria-label={`Delete ${lesson.title}`} disabled={busy !== null}
                                                        onClick={() => window.confirm(`Delete “${lesson.title}”? This can’t be undone.`) && run(lesson.id, () => api(`/lessons/${lesson.id}`, { method: "DELETE" }))}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {viewing && <LessonDetail lesson={viewing} canEdit={canEdit} onEdit={() => { setEditing(viewing); setViewing(null); }} onClose={() => setViewing(null)} />}
            {editing && <LessonForm lesson={editing} classSubjects={classSubjects} onClose={() => setEditing(null)} />}
        </>
    );
}
