"use client";

import {Bell, CallendarDays, LayoutGrid, Search} from "lucide-react";
import type {LucideIcon} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";

import {ThemeToggle} from "@/app/components/ThemeToggle";

export type Portal = "admin" | "teachers" | "students";

type NavItem = {
    href: string;
    label: string;
    icon?: LucideIcon;
}

//add types here as you build the pages
const NAV: Record<Portal, NavItem[]> = {
    admin: [{
        href: "/",
        label: "Overview",
        icon: LayoutGrid
    }],
    teachers: [{
        href: "/",
        label: "Calender",
        icon: LayoutGrid
    }],
    students: [{
        href: "/",
        label: "Timetable",
        icon: LayoutGrid
    }],
}

export function AppShell({
                             portal,
                             name,
                             children,
                         }: {
    portal: Portal;
    name: string;
    children: React.ReactNode;
}) {
    // The path may or may not include the portal folder depending on rewrite handling
    const pathname = usePathname().replace(new RegExp(`^/${portal}`), "") || "/";

    return (
        <div className="mx-auto min-h-screen max-w-360 p-3 sm:p-6 lg:p-8">
            <div className="glass flex min-h-[calc(100vh-4rem)] flex-col gap-6 rounded-4xl p-5 lg:p-8">
                <header className="flex items-center gap-4 lg:gap-6">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-white">
                        L
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-xl font-semibold lg:text-2xl">Welcome back, {name}</h1>
                        <p className="text-sm text-muted">Here&apos;s what&apos;s on your agenda.</p>
                    </div>
                    <label className="hidden items-center gap-2 rounded-full border border-line bg-cell px-4 py-2.5 md:flex">
                        <Search className="size-4 text-muted" />
                        <input
                            placeholder="Search lessons"
                            className="w-48 bg-transparent text-sm outline-none placeholder:text-muted"
                        />
                    </label>
                    <ThemeToggle />
                    <button
                        type="button"
                        aria-label="Notifications"
                        className="grid size-10 place-items-center rounded-full border border-line bg-cell transition hover:bg-accent-soft"
                    >
                        <Bell className="size-4" />
                    </button>
                </header>

                <div className="flex flex-1 gap-4 lg:gap-6">
                    <nav className="flex flex-col gap-3 self-start rounded-full border border-line bg-cell p-2">
                        {NAV[portal].map(({ href, label, icon: Icon }) => {
                            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    aria-label={label}
                                    title={label}
                                    className={`grid size-10 place-items-center rounded-full transition ${
                                        active ? "bg-accent text-white" : "text-muted hover:bg-accent-soft hover:text-fg"
                                    }`}
                                >
                                    <Icon className="size-4" />
                                </Link>
                            );
                        })}
                    </nav>
                    <main className="min-w-0 flex-1">{children}</main>
                </div>
            </div>
        </div>
    );
}