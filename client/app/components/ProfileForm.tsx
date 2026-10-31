"use client";

import { Camera, Trash2 } from "lucide-react";
import { FormEvent, useRef, useState } from "react";

import { Avatar } from "@/app/components/Avatar";
import { Field } from "@/app/components/Field";
import type { UserProfile } from "@/lib/auth";
import { api } from "@/lib/client";
import { useAction } from "@/lib/useAction";

const ROLE_LABEL = { admin: "Administrator", teacher: "Teacher", student: "Student" } as const;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function ProfileForm({ profile }: { profile: UserProfile }) {
    const details = useAction();
    const photo = useAction();
    const fileInput = useRef<HTMLInputElement>(null);
    const [firstName, setFirstName] = useState(profile.first_name);
    const [lastName, setLastName] = useState(profile.last_name);
    const [saved, setSaved] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSaved, setPasswordSaved] = useState(false);
    const [passwordBusy, setPasswordBusy] = useState(false);

    const fullName = `${profile.first_name} ${profile.last_name}`;

    function saveDetails(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaved("");
        if (!firstName.trim() || !lastName.trim()) return details.setError("Enter your first and last name.");
        details.run("save", () => api("/users/me", { method: "PATCH", body: { first_name: firstName.trim(), last_name: lastName.trim() } }), () => setSaved("Your details were updated."));
    }

    function upload(file: File | undefined) {
        if (!file) return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return photo.setError("Choose a PNG, JPG or WebP picture.");
        if (file.size > MAX_AVATAR_BYTES) return photo.setError("That picture is too large. Choose one under 2 MB.");
        const form = new FormData();
        form.set("file", file);
        photo.run("upload", () => api("/users/me/avatar", { form }));
        if (fileInput.current) fileInput.current.value = "";
    }

    async function changePassword(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPasswordError("");
        setPasswordSaved(false);
        if (newPassword.length < 10) return setPasswordError("Choose a password that’s at least 10 characters long.");
        if (newPassword !== confirmation) return setPasswordError("Those new passwords don’t match.");
        setPasswordBusy(true);
        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
            });
            const result = await response.json() as { error?: string };
            if (!response.ok) {
                setPasswordError(result.error === "session_ended" ? "Your session ended. Sign in again to continue." : "We couldn’t update your password. Check your current password and try again.");
                return;
            }
            setPasswordSaved(true);
            setCurrentPassword(""); setNewPassword(""); setConfirmation("");
        } catch {
            setPasswordError("We couldn’t reach the server. Check your connection and try again.");
        } finally {
            setPasswordBusy(false);
        }
    }

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
            <div className="page-head">
                <div><span className="eyebrow">YOUR ACCOUNT</span><h2>My profile</h2><p>Update how you appear in Tutorium and keep your account secure.</p></div>
            </div>

            <section className="glass panel">
                <h3>Profile picture</h3>
                <div className="mt-4 flex flex-wrap items-center gap-5">
                    <Avatar name={fullName} src={profile.avatar_url} size={84} />
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => upload(event.target.files?.[0])} />
                            <button type="button" className="btn btn-sm" disabled={photo.busy !== null} onClick={() => fileInput.current?.click()}>
                                <Camera size={14} /> {photo.busy === "upload" ? "Uploading…" : profile.avatar_url ? "Replace picture" : "Upload picture"}
                            </button>
                            {profile.avatar_url && (
                                <button type="button" className="btn btn-sm btn-danger" disabled={photo.busy !== null} onClick={() => photo.run("remove", () => api("/users/me/avatar", { method: "DELETE" }))}>
                                    <Trash2 size={14} /> Remove
                                </button>
                            )}
                        </div>
                        <p className="panel-sub">PNG, JPG or WebP, up to 2 MB.</p>
                    </div>
                </div>
                {photo.error && <p className="alert mt-3" role="alert">{photo.error}</p>}
            </section>

            <form className="glass panel form-grid" onSubmit={saveDetails}>
                <h3 className="full">Your details</h3>
                <Field label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={80} autoComplete="given-name" />
                <Field label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={80} autoComplete="family-name" />
                <Field label="Login ID" value={profile.login_id} readOnly hint="You sign in with this. It can’t be changed." />
                <Field label="Role" value={ROLE_LABEL[profile.role]} readOnly />
                <Field label="Email" value={profile.email ?? "Not provided"} readOnly full hint="To change your email address, ask your school administrator." />
                {details.error && <p className="alert full" role="alert">{details.error}</p>}
                {saved && !details.error && <p className="alert alert-success full" role="status">{saved}</p>}
                <div className="form-actions full"><button className="btn btn-primary" disabled={details.busy !== null}>{details.busy === "save" ? "Saving…" : "Save changes"}</button></div>
            </form>

            <form className="glass panel form-grid" onSubmit={changePassword}>
                <h3 className="full">Change password</h3>
                <Field label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} full required />
                <Field label="New password" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} hint="At least 10 characters." required />
                <Field label="Confirm new password" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
                {passwordError && <p className="alert full" role="alert">{passwordError}</p>}
                {passwordSaved && <p className="alert alert-success full" role="status">Your password was updated.</p>}
                <div className="form-actions full"><button className="btn btn-primary" disabled={passwordBusy}>{passwordBusy ? "Saving…" : "Update password"}</button></div>
            </form>
        </div>
    );
}
