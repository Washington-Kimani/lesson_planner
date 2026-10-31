"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { Field } from "@/app/components/Field";
import { Modal } from "@/app/components/Modal";
import { api } from "@/lib/client";
import { subjectColor } from "@/lib/dates";
import { useAction } from "@/lib/useAction";
import type { Subject } from "@/lib/types";

export function SubjectsManager({ subjects }: { subjects: Subject[] }) {
    const { run, busy, error, setError } = useAction();
    const [form, setForm] = useState<{ subject?: Subject } | null>(null);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");

    function open(subject?: Subject) {
        setName(subject?.name ?? "");
        setCode(subject?.code ?? "");
        setError("");
        setForm({ subject });
    }

    function save(event: FormEvent) {
        event.preventDefault();
        if (!name.trim()) return setError("Enter a subject name.");
        const generatedCode = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20) || "SUBJECT";
        const body = { name: name.trim(), code: code.trim() || generatedCode };
        const subject = form?.subject;
        run("save", () => subject ? api(`/subjects/${subject.id}`, { method: "PATCH", body }) : api("/subjects", { body }), () => setForm(null));
    }

    return (
        <>
            <div className="toolbar"><button type="button" className="btn btn-primary" onClick={() => open()}><Plus size={15} /> New subject</button></div>
            {error && !form && <p className="alert mb-4" role="alert">{error}</p>}
            {subjects.length === 0 ? <p className="empty">No subjects yet. Add the subjects your teachers will plan lessons for.</p> : (
                <div className="glass table-wrap rounded-2xl">
                    <table className="table">
                        <thead><tr><th>Subject</th><th>Code</th><th aria-label="Actions" /></tr></thead>
                        <tbody>
                            {subjects.map((subject) => (
                                <tr key={subject.id}>
                                    <td><span className="flex items-center gap-2 cell-main"><i className="block size-2.5 rounded-full" style={{ background: subjectColor(subject.name) }} />{subject.name}</span></td>
                                    <td>{subject.code ?? "—"}</td>
                                    <td><div className="row-actions">
                                        <button type="button" className="btn btn-sm" aria-label={`Edit ${subject.name}`} onClick={() => open(subject)}><Pencil size={14} /></button>
                                        <button type="button" className="btn btn-sm btn-danger" aria-label={`Delete ${subject.name}`} disabled={busy !== null}
                                            onClick={() => window.confirm(`Delete ${subject.name}? Its teaching assignments and lessons will be removed too.`) && run(subject.id, () => api(`/subjects/${subject.id}`, { method: "DELETE" }))}><Trash2 size={14} /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {form && (
                <Modal title={form.subject ? "Edit subject" : "New subject"} onClose={() => setForm(null)}>
                    <form onSubmit={save} className="flex flex-col gap-4">
                        <Field label="Subject name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Mathematics" maxLength={80} required />
                        <Field label="Code (optional)" value={code} onChange={(event) => setCode(event.target.value)} placeholder="MATH" maxLength={20} />
                        {error && <p className="alert" role="alert">{error}</p>}
                        <div className="form-actions"><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary" disabled={busy !== null}>{busy === "save" ? "Saving…" : "Save subject"}</button></div>
                    </form>
                </Modal>
            )}
        </>
    );
}
