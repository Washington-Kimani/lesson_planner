"use client";

import { CheckCircle2, UserPlus } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { Field } from "@/app/components/Field";
import { portalHref } from "@/lib/portal";

const EMPTY = {
    first_name: "", last_name: "", email: "", phone: "", subjects: "",
    department: "", qualification: "", employee_number: "", message: "",
};

const errorMessages: Record<string, string> = {
    invalid: "Some details look incorrect. Check the form and try again.",
    duplicate: "We already have a request for this email address, or an account already exists. If you need help, contact your school administrator.",
    too_many_attempts: "Too many attempts. Wait a few minutes and try again.",
    connection: "We couldn’t reach the server. Check your connection and try again.",
};

export function AccountRequestForm() {
    const [form, setForm] = useState(EMPTY);
    const [consent, setConsent] = useState(false);
    const [trap, setTrap] = useState(""); // honeypot: people never see this field, bots fill it in
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const set = (key: keyof typeof EMPTY) =>
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: event.target.value });

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        if (!form.first_name.trim() || !form.last_name.trim()) return setError("Enter your first and last name.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Enter a valid email address.");
        if (form.phone.trim().length < 7) return setError("Enter a phone number we can reach you on.");
        if (!form.subjects.trim()) return setError("Tell us which subjects you teach.");
        if (!consent) return setError("Please confirm your details are correct so we can set up your account.");
        if (trap) { setSent(true); return; }

        setLoading(true);
        try {
            const response = await fetch("/api/account-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, consent }),
            });
            const result = await response.json() as { error?: string };
            if (!response.ok) {
                setError(errorMessages[result.error ?? ""] ?? errorMessages.connection);
                return;
            }
            setSent(true);
        } catch {
            setError(errorMessages.connection);
        } finally {
            setLoading(false);
        }
    }

    if (sent) {
        return (
            <section className="auth-card auth-card-wide success-card">
                <div className="auth-icon"><CheckCircle2 size={22} /></div>
                <span className="eyebrow">REQUEST SENT</span>
                <h1>Thanks, we’ve got it</h1>
                <p className="auth-subtitle">
                    A school administrator will review your request. When it’s approved, your login ID and a temporary password are emailed to <strong>{form.email}</strong>. Check your spam folder if you don’t see it.
                </p>
                <a className="button button-primary" href={portalHref("teachers")}>Go to teacher sign in</a>
                <p className="portal-switch"><Link href="/">Back to the home page</Link></p>
            </section>
        );
    }

    return (
        <section className="auth-card auth-card-wide">
            <div className="auth-icon"><UserPlus size={20} /></div>
            <span className="eyebrow">FOR TEACHERS</span>
            <h1>Request a teacher account</h1>
            <p className="auth-subtitle">Tell us a little about yourself. A school administrator reviews every request and creates your account once it’s approved.</p>
            <form onSubmit={submit} className="form-grid" noValidate>
                <Field label="First name" value={form.first_name} onChange={set("first_name")} maxLength={80} autoComplete="given-name" required />
                <Field label="Last name" value={form.last_name} onChange={set("last_name")} maxLength={80} autoComplete="family-name" required />
                <Field label="Email address" type="email" value={form.email} onChange={set("email")} maxLength={254} autoComplete="email" hint="Your login details will be sent here." required />
                <Field label="Phone number" type="tel" value={form.phone} onChange={set("phone")} maxLength={30} autoComplete="tel" required />
                <Field label="Subjects you teach" value={form.subjects} onChange={set("subjects")} maxLength={200} placeholder="Mathematics, Physics" full required />
                <Field label="Department (optional)" value={form.department} onChange={set("department")} maxLength={100} />
                <Field label="Qualification (optional)" value={form.qualification} onChange={set("qualification")} maxLength={150} placeholder="B.Ed Mathematics" />
                <Field label="Employee number (optional)" value={form.employee_number} onChange={set("employee_number")} maxLength={50} full />
                <div className="field full">
                    <label htmlFor="request-message">Anything else we should know? (optional)</label>
                    <textarea id="request-message" className="input" maxLength={1000} value={form.message} onChange={set("message")} />
                </div>
                <div className="sr-only-field" aria-hidden="true">
                    <label htmlFor="website">Leave this field empty</label>
                    <input id="website" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(event) => setTrap(event.target.value)} />
                </div>
                <label className="check-row full">
                    <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                    <span>I confirm these details are correct, and I’m happy for Tutorium to contact me by email and phone about my account.</span>
                </label>
                {error && <p className="alert full" role="alert">{error}</p>}
                <button type="submit" className="button button-primary full" disabled={loading}>{loading ? "Sending…" : "Send request"}</button>
            </form>
            <p className="auth-help">Already have an account? <a href={portalHref("teachers")}>Sign in</a>. Students don’t need to request an account, as their teacher creates it for them.</p>
        </section>
    );
}
