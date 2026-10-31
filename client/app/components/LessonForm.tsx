"use client";

import { FormEvent, useState } from "react";

import { Modal } from "@/app/components/Modal";
import { api } from "@/lib/client";
import { useAction } from "@/lib/useAction";
import type { ClassSubject, Lesson, LessonInput, LessonStatus } from "@/lib/types";

export function LessonForm({ lesson, date, classSubjects, onClose }: {
    lesson?: Lesson;
    date?: string;
    classSubjects: ClassSubject[];
    onClose: () => void;
}) {
    const { run, busy, error, setError } = useAction();
    const [classSubjectId, setClassSubjectId] = useState(lesson?.class_subject_id ?? classSubjects[0]?.id ?? "");
    const [title, setTitle] = useState(lesson?.title ?? "");
    const [lessonDate, setLessonDate] = useState(lesson?.lesson_date ?? date ?? "");
    const [startTime, setStartTime] = useState(lesson?.start_time.slice(0, 5) ?? "09:00");
    const [duration, setDuration] = useState(String(lesson?.duration_minutes ?? 40));
    const [objectives, setObjectives] = useState(lesson?.objectives ?? "");
    const [content, setContent] = useState(lesson?.content ?? "");
    const [materials, setMaterials] = useState(lesson?.materials ?? "");
    const [homework, setHomework] = useState(lesson?.homework ?? "");
    const [status, setStatus] = useState<LessonStatus>(lesson?.status ?? "draft");

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const minutes = Number(duration);
        if (!title.trim()) return setError("Give the lesson a title.");
        if (!classSubjectId) return setError("Choose the class and subject this lesson is for.");
        if (!lessonDate) return setError("Choose a date for the lesson.");
        if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) return setError("Lesson length must be between 5 and 480 minutes.");

        const orNull = (value: string) => value.trim() || null;
        const payload: LessonInput = {
            class_subject_id: classSubjectId,
            title: title.trim(),
            objectives: orNull(objectives),
            content: orNull(content),
            materials: orNull(materials),
            homework: orNull(homework),
            lesson_date: lessonDate,
            start_time: startTime,
            duration_minutes: minutes,
            status,
        };
        run("save", () => lesson
            ? api(`/lessons/${lesson.id}`, { method: "PATCH", body: payload })
            : api("/lessons", { body: payload }), onClose);
    }

    function remove() {
        if (!lesson || !window.confirm(`Delete “${lesson.title}”? This can’t be undone.`)) return;
        run("delete", () => api(`/lessons/${lesson.id}`, { method: "DELETE" }), onClose);
    }

    return (
        <Modal title={lesson ? "Edit lesson" : "New lesson"} onClose={onClose} wide>
            <form onSubmit={submit} className="form-grid">
                <div className="field full">
                    <label htmlFor="lesson-class">Class and subject</label>
                    <select id="lesson-class" className="input" value={classSubjectId} onChange={(event) => setClassSubjectId(event.target.value)}>
                        {classSubjects.map((item) => <option key={item.id} value={item.id}>{item.class_name} · {item.subject_name}</option>)}
                    </select>
                </div>
                <div className="field full">
                    <label htmlFor="lesson-title">Title</label>
                    <input id="lesson-title" className="input" maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Introduction to fractions" />
                </div>
                <div className="field">
                    <label htmlFor="lesson-date">Date</label>
                    <input id="lesson-date" type="date" className="input" value={lessonDate} onChange={(event) => setLessonDate(event.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="lesson-time">Start time</label>
                    <input id="lesson-time" type="time" className="input" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="lesson-duration">Length (minutes)</label>
                    <input id="lesson-duration" type="number" min={5} max={480} step={5} className="input" value={duration} onChange={(event) => setDuration(event.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="lesson-status">Status</label>
                    <select id="lesson-status" className="input" value={status} onChange={(event) => setStatus(event.target.value as LessonStatus)}>
                        <option value="draft">Draft — only you can see it</option>
                        <option value="published">Published — students can see it</option>
                    </select>
                </div>
                <div className="field full">
                    <label htmlFor="lesson-objectives">Objectives</label>
                    <textarea id="lesson-objectives" className="input" value={objectives} onChange={(event) => setObjectives(event.target.value)} placeholder="What should students be able to do by the end?" />
                </div>
                <div className="field full">
                    <label htmlFor="lesson-content">Lesson plan</label>
                    <textarea id="lesson-content" className="input" value={content} onChange={(event) => setContent(event.target.value)} placeholder="How the lesson will run" />
                </div>
                <div className="field">
                    <label htmlFor="lesson-materials">Materials</label>
                    <textarea id="lesson-materials" className="input" value={materials} onChange={(event) => setMaterials(event.target.value)} placeholder="Textbook p. 42, ruler, graph paper" />
                </div>
                <div className="field">
                    <label htmlFor="lesson-homework">Homework</label>
                    <textarea id="lesson-homework" className="input" value={homework} onChange={(event) => setHomework(event.target.value)} placeholder="Exercise 3A, questions 1–10" />
                </div>
                {error && <p className="alert full" role="alert">{error}</p>}
                <div className="form-actions full">
                    {lesson && <button type="button" className="btn btn-danger" style={{ marginRight: "auto" }} disabled={busy !== null} onClick={remove}>{busy === "delete" ? "Deleting…" : "Delete"}</button>}
                    <button type="button" className="btn" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={busy !== null}>{busy === "save" ? "Saving…" : lesson ? "Save changes" : "Create lesson"}</button>
                </div>
            </form>
        </Modal>
    );
}
