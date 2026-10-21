"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ChangePasswordForm() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        if (newPassword.length < 10) {
            setError("Choose a password that’s at least 10 characters long.");
            return;
        }
        if (newPassword !== confirmation) {
            setError("Those new passwords don’t match.");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
            });
            const result = await response.json() as { error?: string };
            if (!response.ok) {
                setError(result.error === "connection" ? "We couldn’t reach the server. Check your connection and try again." :
                    result.error === "session_ended" ? "Your session ended. Sign in again to continue." :
                        "We couldn’t update your password. Check your current password and try again.");
                if (result.error === "session_ended") router.replace("/login?status=session");
                return;
            }
            router.replace("/");
            router.refresh();
        } catch {
            setError("We couldn’t reach the server. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <header className="auth-header"><Link className="wordmark" href="/"><span className="brand-mark">L</span>Lesson Planner</Link><span>Secure your account</span></header>
            <section className="auth-card">
                <div className="auth-icon">✦</div><span className="eyebrow">ONE QUICK STEP</span>
                <h1>Choose a new password</h1>
                <p className="auth-subtitle">Your temporary password is only for getting started. Choose a new password of at least 10 characters.</p>
                <form className="auth-form" onSubmit={submit}>
                    <label htmlFor="current-password">Temporary password</label>
                    <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
                    <label htmlFor="new-password">New password</label>
                    <input id="new-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                    <label htmlFor="confirm-password">Confirm new password</label>
                    <input id="confirm-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button className="button button-dark auth-submit" disabled={loading}>{loading ? "Saving…" : "Save password"}</button>
                </form>
                <p className="auth-help">Use at least 10 characters. Don’t reuse a password you use elsewhere.</p>
            </section>
        </main>
    );
}
