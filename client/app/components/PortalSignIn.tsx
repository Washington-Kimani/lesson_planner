"use client";

import { Eye, EyeOff, LockKeyhole, MoveRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { PortalRole } from "@/lib/portal";
import { portalHref, publicHref } from "@/lib/portal";

const details = {
    teachers: {
        title: "Teacher sign in",
        subtitle: "Welcome back. Sign in to plan and manage your lessons.",
        placeholder: "TCH-AB12-CD34",
        helper: "Your login ID was emailed to you when your account was created.",
        forgot: "Forgot your password or login ID? Ask a school administrator to help you.",
        note: <>Don’t have an account yet? <Link href={publicHref("/request-account")}>Request a teacher account</Link> and an administrator will set it up. <Link href={publicHref("/accounts")}>See how accounts work.</Link></>,
        notYou: <>Not a teacher? <a href={portalHref("students")}>Student portal</a> · <a href={portalHref("admin")}>Administrator portal</a></>,
    },
    students: {
        title: "Student sign in",
        subtitle: "Sign in to see your lessons.",
        placeholder: "STU-AB12-CD34",
        helper: "Your login ID starts with STU. Your parent or guardian received it by email.",
        forgot: "Forgot your password? Ask your teacher to help you.",
        note: <>First time here? Use the temporary password from your login email. You’ll choose a new one after you sign in.</>,
        notYou: <>Not a student? <a href={portalHref("teachers")}>Teacher portal</a></>,
    },
    admin: {
        title: "Administrator sign in",
        subtitle: "Sign in to manage classes, subjects and teaching assignments.",
        placeholder: "ADM-AB12-CD34",
        helper: "Enter the login ID you received from the person who runs this system.",
        forgot: "Forgot your password? Ask another administrator, or contact your school.",
        note: null,
        notYou: <>Not an administrator? <a href={portalHref("teachers")}>Teacher portal</a> · <a href={portalHref("students")}>Student portal</a></>,
    },
} satisfies Record<PortalRole, {
    title: string;
    subtitle: string;
    placeholder: string;
    helper: string;
    forgot: string;
    note: React.ReactNode;
    notYou: React.ReactNode;
}>;

const errorMessages: Record<string, string> = {
    invalid_credentials: "That login ID and password don’t match. Check them and try again.",
    empty_login: "Enter your login ID.",
    empty_password: "Enter your password.",
    connection: "We couldn’t reach the server. Check your connection and try again.",
    wrong_portal: "This account can’t sign in here. Try the Teacher, Student or Administrator portal instead.",
    too_many_attempts: "Too many attempts. Wait a few minutes and try again.",
};

export function PortalSignIn({ portal, status }: { portal: PortalRole; status?: string }) {
    const router = useRouter();
    const content = details[portal];
    const [showPassword, setShowPassword] = useState(false);
    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(status === "session" ? "You were signed out. Sign in again to continue." : status === "connection" ? errorMessages.connection : "");
    const [loading, setLoading] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        if (!loginId.trim()) {
            setError(errorMessages.empty_login);
            return;
        }
        if (!password) {
            setError(errorMessages.empty_password);
            return;
        }
        setLoading(true);
        const body = new FormData();
        body.set("portal", portal);
        body.set("login_id", loginId);
        body.set("password", password);
        try {
            const response = await fetch("/api/auth/login", { method: "POST", body });
            const result = await response.json() as { error?: string; must_change_password?: boolean };
            if (!response.ok) {
                setError(result.error === "account_inactive" ? errorMessages.invalid_credentials : errorMessages[result.error ?? ""] ?? errorMessages.connection);
                return;
            }
            router.replace(result.must_change_password ? "/change-password" : "/");
            router.refresh();
        } catch {
            setError(errorMessages.connection);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <header className="auth-header"><Link className="wordmark" href={publicHref("/")}><span className="brand-mark">T</span>Tutorium</Link><a href={publicHref("/help")}>Help</a></header>
            <section className="auth-card">
                <div className="auth-icon"><LockKeyhole size={20} /></div>
                <span className="eyebrow">YOUR SCHOOL PORTAL</span>
                <h1>{content.title}</h1>
                <p className="auth-subtitle">{content.subtitle}</p>
                <form onSubmit={submit} className="auth-form">
                    <label htmlFor="login_id">Login ID</label>
                    <input id="login_id" name="login_id" autoComplete="username" placeholder={content.placeholder} value={loginId} onChange={(event) => setLoginId(event.target.value)} />
                    <p className="field-help">{content.helper}</p>
                    <label htmlFor="password">Password</label>
                    <div className="password-field"><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}<span>{showPassword ? "Hide" : "Show"} password</span></button></div>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button type="submit" className="button button-primary auth-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"} {!loading && <MoveRight size={16} />}</button>
                </form>
                <p className="auth-help">{content.forgot}</p>
                {content.note && <p className="auth-note">{content.note}</p>}
                <p className="portal-switch">{content.notYou}</p>
            </section>
            <footer className="auth-footer"><Link href={publicHref("/privacy")}>Privacy</Link><Link href={publicHref("/contact")}>Contact</Link><span>© {new Date().getFullYear()} Your School</span></footer>
        </main>
    );
}
