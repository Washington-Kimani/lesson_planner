"use client";

import {
    Bell, BookOpen, CalendarDays, ClipboardList, GraduationCap, Home, LayoutGrid, Library, Search,
    UserCheck, UserRound, UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/app/components/Avatar";
import { LogoutButton } from "@/app/components/LogoutButton";
import { ThemeToggle } from "@/app/components/ThemeToggle";

export type Portal = "admin" | "teachers" | "students";

type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: "requests";
};

const NAV: Record<Portal, NavItem[]> = {
    admin: [
        { href: "/", label: "Overview", icon: LayoutGrid },
        { href: "/requests", label: "Requests", icon: UserCheck, badge: "requests" },
        { href: "/teachers", label: "Teachers", icon: GraduationCap },
        { href: "/students", label: "Students", icon: UsersRound },
        { href: "/classes", label: "Classes", icon: Library },
        { href: "/subjects", label: "Subjects", icon: BookOpen },
        { href: "/assignments", label: "Assignments", icon: ClipboardList },
        { href: "/calendar", label: "Calendar", icon: CalendarDays },
        { href: "/lessons", label: "Lessons", icon: Home },
    ],
    teachers: [
        { href: "/", label: "Calendar", icon: CalendarDays },
        { href: "/lessons", label: "Lessons", icon: BookOpen },
        { href: "/classes", label: "My classes", icon: Library },
        { href: "/students", label: "Students", icon: UsersRound },
    ],
    students: [
        { href: "/", label: "Timetable", icon: CalendarDays },
        { href: "/lessons", label: "Lessons", icon: BookOpen },
        { href: "/homework", label: "Homework", icon: ClipboardList },
        { href: "/classes", label: "My classes", icon: Library },
    ],
};

const ROLE_LABEL: Record<Portal, string> = {
    admin: "Administrator",
    teachers: "Teacher",
    students: "Student",
};

export function AppShell({
                             portal,
                             name,
                             avatarUrl,
                             pendingRequests = 0,
                             children,
                         }: {
    portal: Portal;
    name: string;
    avatarUrl?: string | null;
    pendingRequests?: number;
    children: React.ReactNode;
}) {
    const currentPath = usePathname();
    if (currentPath === "/change-password") return <>{children}</>;

    // The path may or may not include the portal folder depending on rewrite handling
    const pathname = currentPath.replace(new RegExp(`^/${portal}`), "") || "/";
    const firstName = name.split(" ")[0];

    const links = (className: string) => NAV[portal].map(({ href, label, icon: Icon, badge }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
            <Link key={href} href={href} className={className} aria-current={active ? "page" : undefined}>
                <Icon size={18} />
                <span>{label}</span>
                {badge === "requests" && pendingRequests > 0 && <span className="side-count">{pendingRequests}</span>}
            </Link>
        );
    });

    return (
        <div className="min-h-screen lg:flex">
            <aside className="app-sidebar" aria-label={`${ROLE_LABEL[portal]} navigation`}>
                <Link className="wordmark" href="/"><span className="brand-mark">T</span>Tutorium</Link>
                <span className="portal-role">{ROLE_LABEL[portal]} portal</span>
                {links("side-link")}
                <div className="side-spacer" />
                <div className="side-divider" />
                <Link
                    href="/profile"
                    className="side-link"
                    aria-current={pathname === "/profile" ? "page" : undefined}
                >
                    <UserRound size={18} /><span>My profile</span>
                </Link>
            </aside>

            <div className="min-w-0 flex-1">
                <header className="app-topbar">
                    <span className="lg:hidden"><Link className="wordmark" href="/"><span className="brand-mark">T</span></Link></span>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-lg font-semibold tracking-tight lg:text-xl">Welcome back, {firstName}</h1>
                        <p className="hidden text-xs text-muted sm:block">{ROLE_LABEL[portal]} · Tutorium</p>
                    </div>
                    <form action="/lessons" role="search" className="search-box">
                        <Search className="size-4 text-muted" />
                        <input name="q" placeholder="Search lessons" aria-label="Search lessons" />
                    </form>
                    <ThemeToggle />
                    {portal === "admin" && (
                        <Link href="/requests" className="icon-button" aria-label={`Account requests${pendingRequests ? `, ${pendingRequests} pending` : ""}`}>
                            <Bell className="size-4" />
                            {pendingRequests > 0 && <span className="icon-badge">{pendingRequests}</span>}
                        </Link>
                    )}
                    <Link href="/profile" className="user-chip" aria-label="My profile">
                        <Avatar name={name} src={avatarUrl} size={30} />
                        <span className="name">{name}</span>
                    </Link>
                    <LogoutButton />
                </header>

                <main className="app-main">{children}</main>
            </div>

            <nav aria-label={`${ROLE_LABEL[portal]} navigation`} className="portal-nav">
                {links("side-link")}
                <Link href="/profile" className="side-link" aria-current={pathname === "/profile" ? "page" : undefined}>
                    <UserRound size={18} /><span>Profile</span>
                </Link>
            </nav>
        </div>
    );
}
