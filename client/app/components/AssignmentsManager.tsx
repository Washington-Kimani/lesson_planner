"use client";

import { Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { api } from "@/lib/client";
import { subjectColor } from "@/lib/dates";
import { useAction } from "@/lib/useAction";
import type { ClassRoom, ClassSubject, Subject, Teacher } from "@/lib/types";

export function AssignmentsManager({ assignments, classes, subjects, teachers }: {
    assignments: ClassSubject[];
    classes: ClassRoom[];
    subjects: Subject[];
    teachers: Teacher[];
}) {
    const { run, busy, error, setError } = useAction();
    const [classId, setClassId] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [teacherId, setTeacherId] = useState("");
    const [filter, setFilter] = useState("");
    const activeTeachers = teachers.filter((t) => t.is_active);
    const ready = classes.length > 0 && subjects.length > 0 && activeTeachers.length > 0;
    const visible = assignments.filter((a) => !filter || a.class_id === filter);

    function assign(event: FormEvent) {
        event.preventDefault();
        if (!classId || !subjectId || !teacherId) return setError("Choose a class, a subject and a teacher.");
        run("assign", () => api("/class-subjects", { body: { class_id: classId, subject_id: subjectId, teacher_id: teacherId } }), () => { setSubjectId(""); setTeacherId(""); });
    }

    return (
        <div className="flex flex-col gap-4">
            <section className="glass panel">
                <h3>Assign a teacher</h3>
                <p className="panel-sub">Connect a teacher and a subject to a class. Teachers can then plan lessons for it.</p>
                {!ready ? (
                    <p className="alert alert-warn mt-4">You need at least one class, one subject and one active teacher before you can make an assignment.</p>
                ) : (
                    <form onSubmit={assign} className="mt-4 grid items-end gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                        <div className="field"><label htmlFor="as-class">Class</label><select id="as-class" className="input" value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Choose…</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.academic_year}</option>)}</select></div>
                        <div className="field"><label htmlFor="as-subject">Subject</label><select id="as-subject" className="input" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Choose…</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <div className="field"><label htmlFor="as-teacher">Teacher</label><select id="as-teacher" className="input" value={teacherId} onChange={(event) => setTeacherId(event.target.value)}><option value="">Choose…</option>{activeTeachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}</select></div>
                        <button className="btn btn-primary" disabled={busy !== null}>{busy === "assign" ? "Assigning…" : "Assign"}</button>
                    </form>
                )}
                {error && <p className="alert mt-3" role="alert">{error}</p>}
            </section>

            <div className="toolbar !mb-0">
                <select className="input" aria-label="Filter by class" value={filter} onChange={(event) => setFilter(event.target.value)}>
                    <option value="">All classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            {visible.length === 0 ? <p className="empty">No teaching assignments yet.</p> : (
                <div className="glass table-wrap rounded-2xl">
                    <table className="table">
                        <thead><tr><th>Class</th><th>Subject</th><th>Teacher</th><th aria-label="Actions" /></tr></thead>
                        <tbody>
                            {visible.map((item) => (
                                <tr key={item.id}>
                                    <td className="cell-main">{item.class_name}</td>
                                    <td><span className="flex items-center gap-2"><i className="block size-2.5 rounded-full" style={{ background: subjectColor(item.subject_name) }} />{item.subject_name}</span></td>
                                    <td>{item.teacher_name}</td>
                                    <td><div className="row-actions"><button type="button" className="btn btn-sm btn-danger" aria-label={`Remove ${item.subject_name} from ${item.class_name}`} disabled={busy !== null}
                                        onClick={() => window.confirm(`Remove ${item.teacher_name} from ${item.subject_name} in ${item.class_name}? Lessons already planned for it will be removed too.`) && run(item.id, () => api(`/class-subjects/${item.id}`, { method: "DELETE" }))}><Trash2 size={14} /></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
