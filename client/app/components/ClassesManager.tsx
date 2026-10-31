"use client";

import { Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { Field } from "@/app/components/Field";
import { Modal } from "@/app/components/Modal";
import { api } from "@/lib/client";
import { subjectColor } from "@/lib/dates";
import { useAction } from "@/lib/useAction";
import type { ClassRoom, ClassSubject } from "@/lib/types";

export function ClassesManager({ classes, classSubjects, canManage }: {
    classes: ClassRoom[];
    classSubjects: ClassSubject[];
    canManage: boolean;
}) {
    const { run, busy, error, setError } = useAction();
    const [form, setForm] = useState<{ room?: ClassRoom } | null>(null);
    const [name, setName] = useState("");
    const [year, setYear] = useState("");

    function open(room?: ClassRoom) {
        setName(room?.name ?? "");
        setYear(room?.academic_year ?? String(new Date().getFullYear()));
        setError("");
        setForm({ room });
    }

    function save(event: FormEvent) {
        event.preventDefault();
        if (!name.trim() || !year.trim()) return setError("Enter a class name and academic year.");
        const body = { name: name.trim(), academic_year: year.trim() };
        const room = form?.room;
        run("save", () => room ? api(`/classes/${room.id}`, { method: "PATCH", body }) : api("/classes", { body }), () => setForm(null));
    }

    function remove(room: ClassRoom) {
        if (!window.confirm(`Delete ${room.name}? Its teaching assignments and lessons will be removed too.`)) return;
        run(room.id, () => api(`/classes/${room.id}`, { method: "DELETE" }));
    }

    return (
        <>
            {canManage && <div className="toolbar"><button type="button" className="btn btn-primary" onClick={() => open()}><Plus size={15} /> New class</button></div>}
            {error && !form && <p className="alert mb-4" role="alert">{error}</p>}
            {classes.length === 0 ? <p className="empty">{canManage ? "No classes yet. Create the first one." : "You’re not teaching any classes yet."}</p> : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {classes.map((room) => {
                        const subjects = classSubjects.filter((item) => item.class_id === room.id);
                        return (
                            <article key={room.id} className="glass panel flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3><Link href={`/classes/${room.id}`} className="no-underline hover:text-accent-text">{room.name}</Link></h3>
                                        <p className="panel-sub">{room.academic_year}</p>
                                    </div>
                                    <span className="badge"><UsersRound size={12} /> {room.student_count}</span>
                                </div>
                                <div className="flex min-h-7 flex-wrap gap-1.5">
                                    {subjects.length === 0 && <span className="cell-sub">No subjects assigned</span>}
                                    {subjects.map((item) => (
                                        <span key={item.id} className="badge badge-muted"><i className="block size-2 rounded-full" style={{ background: subjectColor(item.subject_name) }} />{item.subject_name}</span>
                                    ))}
                                </div>
                                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                                    <Link href={`/classes/${room.id}`} className="text-link">Open class</Link>
                                    {canManage && (
                                        <div className="row-actions">
                                            <button type="button" className="btn btn-sm" aria-label={`Edit ${room.name}`} onClick={() => open(room)}><Pencil size={14} /></button>
                                            <button type="button" className="btn btn-sm btn-danger" aria-label={`Delete ${room.name}`} disabled={busy !== null} onClick={() => remove(room)}><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
            {form && (
                <Modal title={form.room ? "Edit class" : "New class"} onClose={() => setForm(null)}>
                    <form onSubmit={save} className="flex flex-col gap-4">
                        <Field label="Class name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Grade 7 East" maxLength={80} required />
                        <Field label="Academic year" value={year} onChange={(event) => setYear(event.target.value)} placeholder="2026" maxLength={20} required />
                        {error && <p className="alert" role="alert">{error}</p>}
                        <div className="form-actions"><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary" disabled={busy !== null}>{busy === "save" ? "Saving…" : "Save class"}</button></div>
                    </form>
                </Modal>
            )}
        </>
    );
}
