"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/app/components/Avatar";
import { api } from "@/lib/client";
import { subjectColor } from "@/lib/dates";
import { useAction } from "@/lib/useAction";
import type { ClassDetail, Student } from "@/lib/types";

export function ClassRoster({ detail, allStudents }: { detail: ClassDetail; allStudents: Student[] }) {
    const { run, busy, error } = useAction();
    const [studentId, setStudentId] = useState("");
    const enrolled = new Set(detail.students.map((s) => s.id));
    const available = allStudents.filter((s) => s.is_active && !enrolled.has(s.id));

    return (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            <section className="glass panel">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><h3>Students</h3><p className="panel-sub">{detail.students.length} enrolled</p></div>
                    <form className="flex gap-2" onSubmit={(event) => {
                        event.preventDefault();
                        if (studentId) run("enroll", () => api(`/classes/${detail.id}/students`, { body: { student_id: studentId } }), () => setStudentId(""));
                    }}>
                        <select className="input !min-h-9 !w-56" aria-label="Student to enroll" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                            <option value="">{available.length ? "Choose a student…" : "No one left to add"}</option>
                            {available.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                        </select>
                        <button className="btn btn-primary btn-sm" disabled={!studentId || busy !== null}><UserPlus size={14} /> {busy === "enroll" ? "Adding…" : "Enroll"}</button>
                    </form>
                </div>
                {error && <p className="alert mt-3" role="alert">{error}</p>}
                {detail.students.length === 0 ? <p className="empty mt-4">No students in this class yet.</p> : (
                    <div className="table-wrap mt-3">
                        <table className="table">
                            <thead><tr><th>Student</th><th>Login ID</th><th aria-label="Actions" /></tr></thead>
                            <tbody>
                                {detail.students.map((student) => (
                                    <tr key={student.id}>
                                        <td><div className="person"><Avatar name={`${student.first_name} ${student.last_name}`} src={student.avatar_url} size={32} /><span className="cell-main">{student.first_name} {student.last_name}</span></div></td>
                                        <td><code>{student.login_id}</code></td>
                                        <td><div className="row-actions"><button type="button" className="btn btn-sm btn-danger" disabled={busy !== null}
                                            onClick={() => window.confirm(`Remove ${student.first_name} from ${detail.name}?`) && run(student.id, () => api(`/classes/${detail.id}/students/${student.id}`, { method: "DELETE" }))}>
                                            <UserMinus size={14} /> {busy === student.id ? "Removing…" : "Remove"}
                                        </button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="glass panel self-start">
                <h3>Subjects and teachers</h3>
                <p className="panel-sub">Who teaches what in this class</p>
                {detail.subjects.length === 0 ? <p className="empty mt-4">No subjects assigned yet.</p> : (
                    <div className="mt-3">
                        {detail.subjects.map((item) => (
                            <div className="link-row" key={item.id}>
                                <span className="flex items-center gap-2 font-semibold"><i className="block size-2.5 rounded-full" style={{ background: subjectColor(item.subject_name) }} />{item.subject_name}</span>
                                <span className="text-muted">{item.teacher_name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
