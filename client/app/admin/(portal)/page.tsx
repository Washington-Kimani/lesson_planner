import { BookOpen, CalendarDays, GraduationCap, Library, UserCheck, UsersRound } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/app/components/Avatar";
import { StatCard } from "@/app/components/StatCard";
import { apiGet } from "@/lib/api";
import { formatStamp } from "@/lib/dates";
import type { AccountRequest, AdminStats } from "@/lib/types";

export const metadata = {
    title: "Administrator overview · Tutorium",
    description: "Manage school classes, subjects and teaching assignments.",
};

const shortcuts = [
    { href: "/teachers", label: "Add or manage teachers" },
    { href: "/classes", label: "Set up classes and enrol students" },
    { href: "/subjects", label: "Manage subjects" },
    { href: "/assignments", label: "Assign teachers to classes" },
];

export default async function AdminHome() {
    const [stats, pending] = await Promise.all([
        apiGet<AdminStats>("/stats"),
        apiGet<AccountRequest[]>("/account-requests?status=pending"),
    ]);
    const published = stats.lessons ? Math.round((stats.published_lessons / stats.lessons) * 100) : 0;

    return (
        <div className="flex flex-col gap-5">
            <div className="page-head">
                <div><span className="eyebrow">SCHOOL SETUP</span><h2>Administrator overview</h2><p>Everything happening across your school at a glance.</p></div>
            </div>

            {stats.pending_requests > 0 && (
                <section className="banner" aria-label="Pending requests">
                    <div>
                        <h3><span className="pill-new">{stats.pending_requests}</span>Teacher account {stats.pending_requests === 1 ? "request" : "requests"} waiting</h3>
                        <p>Review the details and approve to create the account. Login details are emailed automatically.</p>
                    </div>
                    <Link href="/requests" className="btn btn-primary">Review requests</Link>
                </section>
            )}

            <div className="stat-grid">
                <StatCard label="Teachers" value={stats.teachers} icon={GraduationCap} href="/teachers" />
                <StatCard label="Students" value={stats.students} icon={UsersRound} href="/students" />
                <StatCard label="Classes" value={stats.classes} icon={Library} href="/classes" />
                <StatCard label="Subjects" value={stats.subjects} icon={BookOpen} href="/subjects" />
                <StatCard label="Lessons" value={stats.lessons} note={`${published}% published to students`} icon={CalendarDays} href="/lessons" />
                <StatCard label="Requests" value={stats.pending_requests} note="waiting for review" icon={UserCheck} href="/requests" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="glass panel">
                    <h3>Latest requests</h3>
                    <p className="panel-sub">Teachers asking for an account</p>
                    {pending.length === 0 ? <p className="empty mt-4">No requests waiting. You’re all caught up.</p> : (
                        <div className="mt-2">
                            {pending.slice(0, 5).map((request) => (
                                <div className="link-row" key={request.id}>
                                    <div className="person"><Avatar name={`${request.first_name} ${request.last_name}`} size={34} /><div><div className="cell-main">{request.first_name} {request.last_name}</div><div className="cell-sub">{request.subjects}</div></div></div>
                                    <span className="cell-sub">{formatStamp(request.created_at)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                <section className="glass panel">
                    <h3>Quick actions</h3>
                    <p className="panel-sub">Jump straight into common tasks</p>
                    <div className="mt-2">
                        {shortcuts.map(({ href, label }) => (
                            <Link key={href} href={href} className="link-row no-underline hover:text-accent-text"><span>{label}</span><span aria-hidden>→</span></Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
