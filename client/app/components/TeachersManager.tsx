"use client";

import { Plus, Search } from "lucide-react";
import { FormEvent, useState } from "react";

import { Avatar } from "@/app/components/Avatar";
import { Field } from "@/app/components/Field";
import { Modal } from "@/app/components/Modal";
import { formatStamp } from "@/lib/dates";
import { api } from "@/lib/client";
import { useAction } from "@/lib/useAction";
import type { Teacher } from "@/lib/types";

const EMPTY = { first_name: "", last_name: "", email: "", phone: "", employee_number: "", department: "", qualification: "" };

export function TeachersManager({ teachers }: { teachers: Teacher[] }) {
    const { run, busy, error, setError } = useAction();
    const [query, setQuery] = useState("");
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [notice, setNotice] = useState("");

    const visible = teachers.filter((t) => `${t.first_name} ${t.last_name} ${t.login_id} ${t.email ?? ""} ${t.department ?? ""}`.toLowerCase().includes(query.toLowerCase()));
    const set = (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: event.target.value });

    function create(event: FormEvent) {
        event.preventDefault();
        if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) return setError("Enter a first name, last name and email address.");
        const orNull = (value: string) => value.trim() || null;
        run("create", () => api("/teachers", {
            body: {
                first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim(),
                phone: orNull(form.phone), employee_number: orNull(form.employee_number),
                department: orNull(form.department), qualification: orNull(form.qualification),
            },
        }), () => {
            setAdding(false);
            setNotice(`Account created. ${form.first_name} will receive their login ID and a temporary password at ${form.email}.`);
            setForm(EMPTY);
        });
    }

    function resetPassword(teacher: Teacher) {
        if (!window.confirm(`Reset the password for ${teacher.first_name} ${teacher.last_name}? A new temporary password will be emailed to them.`)) return;
        setNotice("");
        run(`reset-${teacher.id}`, () => api(`/teachers/${teacher.id}/reset-password`, { method: "POST" }),
            () => setNotice(`A new temporary password was emailed to ${teacher.email ?? teacher.first_name}.`));
    }

    function toggleActive(teacher: Teacher) {
        const verb = teacher.is_active ? "Deactivate" : "Reactivate";
        if (!window.confirm(`${verb} ${teacher.first_name} ${teacher.last_name}?${teacher.is_active ? " They won’t be able to sign in, but their lessons are kept." : ""}`)) return;
        setNotice("");
        run(`active-${teacher.id}`, () => api(`/teachers/${teacher.id}`, { method: "PATCH", body: { is_active: !teacher.is_active } }));
    }

    return (
        <>
            <div className="toolbar">
                <label className="search-box !flex grow"><Search size={16} className="text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teachers" aria-label="Search teachers" className="!w-full" /></label>
                <button type="button" className="btn btn-primary" onClick={() => { setAdding(true); setError(""); }}><Plus size={15} /> Add teacher</button>
            </div>
            {notice && <p className="alert alert-success mb-4" role="status">{notice}</p>}
            {error && !adding && <p className="alert mb-4" role="alert">{error}</p>}

            {visible.length === 0 ? <p className="empty">{teachers.length ? "No teachers match your search." : "No teachers yet. Add one, or approve a request."}</p> : (
                <div className="glass table-wrap rounded-2xl">
                    <table className="table">
                        <thead><tr><th>Teacher</th><th>Login ID</th><th>Department</th><th>Last sign-in</th><th>Status</th><th aria-label="Actions" /></tr></thead>
                        <tbody>
                            {visible.map((teacher) => (
                                <tr key={teacher.id}>
                                    <td><div className="person"><Avatar name={`${teacher.first_name} ${teacher.last_name}`} src={teacher.avatar_url} /><div><div className="cell-main">{teacher.first_name} {teacher.last_name}</div><div className="cell-sub">{teacher.email ?? "No email"}</div></div></div></td>
                                    <td><code>{teacher.login_id}</code></td>
                                    <td>{teacher.department ?? "—"}{teacher.qualification && <div className="cell-sub">{teacher.qualification}</div>}</td>
                                    <td>{teacher.last_login_at ? formatStamp(teacher.last_login_at) : "Never"}</td>
                                    <td><span className={`badge ${teacher.is_active ? "badge-success" : "badge-muted"}`}>{teacher.is_active ? "Active" : "Inactive"}</span></td>
                                    <td><div className="row-actions">
                                        <button type="button" className="btn btn-sm" disabled={busy !== null} onClick={() => resetPassword(teacher)}>{busy === `reset-${teacher.id}` ? "Sending…" : "Reset password"}</button>
                                        <button type="button" className={`btn btn-sm ${teacher.is_active ? "btn-danger" : ""}`} disabled={busy !== null} onClick={() => toggleActive(teacher)}>{teacher.is_active ? "Deactivate" : "Reactivate"}</button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {adding && (
                <Modal title="Add teacher" onClose={() => setAdding(false)} wide>
                    <form onSubmit={create} className="form-grid">
                        <Field label="First name" value={form.first_name} onChange={set("first_name")} maxLength={80} required />
                        <Field label="Last name" value={form.last_name} onChange={set("last_name")} maxLength={80} required />
                        <Field label="Email" type="email" value={form.email} onChange={set("email")} hint="Their login details are sent here." full required />
                        <Field label="Phone" type="tel" value={form.phone} onChange={set("phone")} />
                        <Field label="Employee number" value={form.employee_number} onChange={set("employee_number")} />
                        <Field label="Department" value={form.department} onChange={set("department")} />
                        <Field label="Qualification" value={form.qualification} onChange={set("qualification")} />
                        {error && <p className="alert full" role="alert">{error}</p>}
                        <div className="form-actions full">
                            <button type="button" className="btn" onClick={() => setAdding(false)}>Cancel</button>
                            <button className="btn btn-primary" disabled={busy !== null}>{busy === "create" ? "Creating…" : "Create account"}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
