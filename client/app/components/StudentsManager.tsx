"use client";

import { Plus, Search } from "lucide-react";
import { FormEvent, useState } from "react";

import { Avatar } from "@/app/components/Avatar";
import { Field } from "@/app/components/Field";
import { Modal } from "@/app/components/Modal";
import { api } from "@/lib/client";
import { useAction } from "@/lib/useAction";
import type { ClassRoom, Student } from "@/lib/types";

const EMPTY = {
    first_name: "", last_name: "", admission_number: "", date_of_birth: "", email: "",
    guardian_name: "", guardian_email: "", guardian_phone: "", class_id: "",
};

function StudentForm({ student, classes, onClose, onSaved }: {
    student?: Student;
    classes: ClassRoom[];
    onClose: () => void;
    onSaved: (message: string) => void;
}) {
    const { run, busy, error, setError } = useAction();
    const [form, setForm] = useState(student ? {
        first_name: student.first_name, last_name: student.last_name, admission_number: student.admission_number ?? "",
        date_of_birth: student.date_of_birth ?? "", email: student.email ?? "", guardian_name: student.guardian_name ?? "",
        guardian_email: student.guardian_email ?? "", guardian_phone: student.guardian_phone ?? "", class_id: "",
    } : EMPTY);
    const set = (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: event.target.value });

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!form.first_name.trim() || !form.last_name.trim()) return setError("Enter the student’s first and last name.");
        if (!form.admission_number.trim() || !form.date_of_birth) return setError("Enter the student’s admission number and date of birth.");
        if (!form.guardian_name.trim() || !form.guardian_email.trim()) return setError("A parent or guardian’s name and email are needed, because login details are sent to them.");
        const orNull = (value: string) => value.trim() || null;
        const body = {
            first_name: form.first_name.trim(), last_name: form.last_name.trim(),
            admission_number: form.admission_number.trim(), date_of_birth: form.date_of_birth, email: orNull(form.email),
            guardian_name: form.guardian_name.trim(), guardian_email: form.guardian_email.trim(), guardian_phone: form.guardian_phone.trim(),
            ...(student ? {} : { class_id: orNull(form.class_id) }),
        };
        run("save", () => student ? api(`/students/${student.id}`, { method: "PATCH", body }) : api("/students", { body }), () => {
            onClose();
            onSaved(student ? "Student details updated." : `Account created. Login details were emailed to ${form.guardian_name} at ${form.guardian_email}.`);
        });
    }

    return (
        <Modal title={student ? "Edit student" : "Add student"} onClose={onClose} wide>
            <form onSubmit={submit} className="form-grid">
                <Field label="First name" value={form.first_name} onChange={set("first_name")} maxLength={80} required />
                <Field label="Last name" value={form.last_name} onChange={set("last_name")} maxLength={80} required />
                <Field label="Admission number" value={form.admission_number} onChange={set("admission_number")} required />
                <Field label="Date of birth" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} required />
                <Field label="Student email (optional)" type="email" value={form.email} onChange={set("email")} full />
                <Field label="Parent or guardian name" value={form.guardian_name} onChange={set("guardian_name")} required />
                <Field label="Parent or guardian phone" type="tel" value={form.guardian_phone} onChange={set("guardian_phone")} />
                <Field label="Parent or guardian email" type="email" value={form.guardian_email} onChange={set("guardian_email")} hint="The student’s login ID and temporary password are emailed here." full required />
                {!student && classes.length > 0 && (
                    <div className="field full">
                        <label htmlFor="student-class">Add to class (optional)</label>
                        <select id="student-class" className="input" value={form.class_id} onChange={set("class_id")}>
                            <option value="">Not yet</option>
                            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.academic_year}</option>)}
                        </select>
                    </div>
                )}
                {error && <p className="alert full" role="alert">{error}</p>}
                <div className="form-actions full">
                    <button type="button" className="btn" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" disabled={busy !== null}>{busy === "save" ? "Saving…" : student ? "Save changes" : "Create account"}</button>
                </div>
            </form>
        </Modal>
    );
}

export function StudentsManager({ students, classes, isAdmin }: { students: Student[]; classes: ClassRoom[]; isAdmin: boolean }) {
    const { run, busy, error } = useAction();
    const [query, setQuery] = useState("");
    const [className, setClassName] = useState("");
    const [form, setForm] = useState<{ student?: Student } | null>(null);
    const [notice, setNotice] = useState("");

    const visible = students.filter((s) =>
        `${s.first_name} ${s.last_name} ${s.login_id} ${s.admission_number ?? ""}`.toLowerCase().includes(query.toLowerCase())
        && (!className || s.class_names.includes(className)));

    function resetPassword(student: Student) {
        if (!window.confirm(`Reset the password for ${student.first_name} ${student.last_name}? A new temporary password will be emailed to their parent or guardian.`)) return;
        setNotice("");
        run(`reset-${student.id}`, () => api(`/students/${student.id}/reset-password`, { method: "POST" }),
            () => setNotice(`A new temporary password was emailed to ${student.guardian_name ?? "the parent or guardian"}.`));
    }

    function toggleActive(student: Student) {
        if (!window.confirm(`${student.is_active ? "Deactivate" : "Reactivate"} ${student.first_name} ${student.last_name}?`)) return;
        setNotice("");
        run(`active-${student.id}`, () => api(`/students/${student.id}`, { method: "PATCH", body: { is_active: !student.is_active } }));
    }

    return (
        <>
            <div className="toolbar">
                <label className="search-box !flex grow"><Search size={16} className="text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, login ID or admission number" aria-label="Search students" className="!w-full" /></label>
                {classes.length > 0 && (
                    <select className="input" aria-label="Filter by class" value={className} onChange={(event) => setClassName(event.target.value)}>
                        <option value="">All classes</option>
                        {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                )}
                <button type="button" className="btn btn-primary" onClick={() => setForm({})}><Plus size={15} /> Add student</button>
            </div>
            {notice && <p className="alert alert-success mb-4" role="status">{notice}</p>}
            {error && <p className="alert mb-4" role="alert">{error}</p>}

            {visible.length === 0 ? <p className="empty">{students.length ? "No students match." : "No students yet. Add a student to create their account."}</p> : (
                <div className="glass table-wrap rounded-2xl">
                    <table className="table">
                        <thead><tr><th>Student</th><th>Login ID</th><th>Classes</th><th>Parent or guardian</th>{isAdmin && <th>Status</th>}<th aria-label="Actions" /></tr></thead>
                        <tbody>
                            {visible.map((student) => (
                                <tr key={student.id}>
                                    <td><div className="person"><Avatar name={`${student.first_name} ${student.last_name}`} src={student.avatar_url} /><div><div className="cell-main">{student.first_name} {student.last_name}</div><div className="cell-sub">{student.admission_number ? `Adm. ${student.admission_number}` : "No admission number"}</div></div></div></td>
                                    <td><code>{student.login_id}</code></td>
                                    <td>{student.class_names.length ? <div className="flex flex-wrap gap-1">{student.class_names.map((name) => <span key={name} className="badge">{name}</span>)}</div> : <span className="cell-sub">Not in a class</span>}</td>
                                    <td>{student.guardian_name ?? "—"}<div className="cell-sub">{student.guardian_email}</div></td>
                                    {isAdmin && <td><span className={`badge ${student.is_active ? "badge-success" : "badge-muted"}`}>{student.is_active ? "Active" : "Inactive"}</span></td>}
                                    <td><div className="row-actions">
                                        <button type="button" className="btn btn-sm" onClick={() => setForm({ student })}>Edit</button>
                                        <button type="button" className="btn btn-sm" disabled={busy !== null} onClick={() => resetPassword(student)}>{busy === `reset-${student.id}` ? "Sending…" : "Reset password"}</button>
                                        {isAdmin && <button type="button" className={`btn btn-sm ${student.is_active ? "btn-danger" : ""}`} disabled={busy !== null} onClick={() => toggleActive(student)}>{student.is_active ? "Deactivate" : "Reactivate"}</button>}
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {form && <StudentForm student={form.student} classes={classes} onClose={() => setForm(null)} onSaved={setNotice} />}
        </>
    );
}
