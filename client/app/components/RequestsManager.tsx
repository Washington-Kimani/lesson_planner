"use client";

import { Check, Mail, Phone, X } from "lucide-react";
import { FormEvent, useState } from "react";

import { Avatar } from "@/app/components/Avatar";
import { Modal } from "@/app/components/Modal";
import { formatStamp } from "@/lib/dates";
import { api } from "@/lib/client";
import { useAction } from "@/lib/useAction";
import type { AccountRequest } from "@/lib/types";

export function RequestsManager({ requests }: { requests: AccountRequest[] }) {
    const { run, busy, error } = useAction();
    const [notice, setNotice] = useState("");
    const [rejecting, setRejecting] = useState<AccountRequest | null>(null);
    const [note, setNote] = useState("");

    function approve(request: AccountRequest) {
        const name = `${request.first_name} ${request.last_name}`;
        if (!window.confirm(`Create a teacher account for ${name}? Their login ID and a temporary password will be emailed to ${request.email}.`)) return;
        setNotice("");
        run(request.id, () => api(`/account-requests/${request.id}/approve`, { method: "POST" }),
            () => setNotice(`${name}’s account was created and their login details were emailed to ${request.email}.`));
    }

    function reject(event: FormEvent) {
        event.preventDefault();
        if (!rejecting) return;
        const target = rejecting;
        setNotice("");
        run(target.id, () => api(`/account-requests/${target.id}/reject`, { body: { note: note.trim() || null } }), () => {
            setRejecting(null);
            setNote("");
            setNotice(`The request from ${target.first_name} ${target.last_name} was declined.`);
        });
    }

    if (requests.length === 0) return <p className="empty">Nothing here yet.</p>;

    return (
        <>
            {notice && <p className="alert alert-success mb-4" role="status">{notice}</p>}
            {error && !rejecting && <p className="alert mb-4" role="alert">{error}</p>}
            <div className="flex flex-col gap-3">
                {requests.map((request) => {
                    const name = `${request.first_name} ${request.last_name}`;
                    const details: [string, string | null][] = [
                        ["Subjects", request.subjects], ["Department", request.department],
                        ["Qualification", request.qualification], ["Employee number", request.employee_number],
                    ];
                    return (
                        <article key={request.id} className="glass panel">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="person">
                                    <Avatar name={name} size={42} />
                                    <div className="min-w-0">
                                        <h3>{name}</h3>
                                        <p className="panel-sub flex flex-wrap gap-x-4 gap-y-1">
                                            <span className="inline-flex items-center gap-1.5"><Mail size={13} />{request.email}</span>
                                            <span className="inline-flex items-center gap-1.5"><Phone size={13} />{request.phone}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="cell-sub">Sent {formatStamp(request.created_at)}</span>
                                    <span className={`badge ${request.status === "approved" ? "badge-success" : request.status === "rejected" ? "badge-danger" : "badge-warn"}`}>
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                                {details.map(([label, value]) => value && (
                                    <div key={label}><dt className="text-xs font-bold text-muted">{label}</dt><dd className="m-0 text-body">{value}</dd></div>
                                ))}
                            </dl>
                            {request.message && <p className="detail-block"><span className="text-xs font-bold text-muted">MESSAGE</span><br /><span className="text-sm text-body">{request.message}</span></p>}
                            {request.status === "pending" ? (
                                <div className="form-actions">
                                    <button type="button" className="btn btn-danger" disabled={busy !== null} onClick={() => { setRejecting(request); setNote(""); }}><X size={15} /> Decline</button>
                                    <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => approve(request)}><Check size={15} /> {busy === request.id ? "Creating account…" : "Approve and create account"}</button>
                                </div>
                            ) : (
                                request.reviewed_at && <p className="cell-sub mt-4">Reviewed {formatStamp(request.reviewed_at)}{request.review_note ? ` · ${request.review_note}` : ""}</p>
                            )}
                        </article>
                    );
                })}
            </div>

            {rejecting && (
                <Modal title="Decline request" onClose={() => setRejecting(null)}>
                    <form onSubmit={reject} className="flex flex-col gap-4">
                        <p className="text-sm text-body">{rejecting.first_name} {rejecting.last_name} won’t get an account. You can add a short reason to keep for your records.</p>
                        <div className="field">
                            <label htmlFor="reject-note">Reason (optional)</label>
                            <textarea id="reject-note" className="input" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
                        </div>
                        {error && <p className="alert" role="alert">{error}</p>}
                        <div className="form-actions">
                            <button type="button" className="btn" onClick={() => setRejecting(null)}>Cancel</button>
                            <button className="btn btn-primary" disabled={busy !== null}>{busy ? "Declining…" : "Decline request"}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
