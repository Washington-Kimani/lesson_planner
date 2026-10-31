import { BookOpen, CalendarDays, ClipboardList, Library } from "lucide-react";

import { Planner } from "@/app/components/Planner";
import { StatCard } from "@/app/components/StatCard";
import { apiGet } from "@/lib/api";
import { formatShortDate, monthKey, todayISO } from "@/lib/dates";
import { getLessonsForMonth } from "@/lib/lessons";
import type { ClassSubject } from "@/lib/types";

type Role = "teacher" | "student" | "admin";

export async function CalendarView({ month, role }: { month?: string; role: Role }) {
    const today = todayISO();
    const valid = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : today.slice(0, 7);
    const [year, monthNumber] = valid.split("-").map(Number);

    const [fetched, classSubjects] = await Promise.all([
        getLessonsForMonth(year, monthNumber - 1),
        role === "teacher" ? apiGet<ClassSubject[]>("/class-subjects") : Promise.resolve([] as ClassSubject[]),
    ]);
    // Students only ever see what their teacher has published
    const lessons = role === "student" ? fetched.filter((lesson) => lesson.status === "published") : fetched;
    const inMonth = lessons.filter((lesson) => lesson.lesson_date.startsWith(valid));
    const todays = lessons.filter((lesson) => lesson.lesson_date === today);
    const next = lessons
        .filter((lesson) => lesson.lesson_date >= today)
        .sort((a, b) => `${a.lesson_date}${a.start_time}`.localeCompare(`${b.lesson_date}${b.start_time}`))[0];

    return (
        <div className="flex flex-col gap-5">
            {role === "teacher" && (
                <div className="stat-grid">
                    <StatCard label="Today" value={todays.length} note={todays.length === 1 ? "lesson today" : "lessons today"} icon={CalendarDays} />
                    <StatCard label="Drafts" value={inMonth.filter((l) => l.status === "draft").length} note="not yet shown to students" icon={ClipboardList} />
                    <StatCard label="This month" value={inMonth.length} note="lessons planned" icon={BookOpen} />
                    <StatCard label="Classes" value={new Set(classSubjects.map((c) => c.class_id)).size} note="you teach" icon={Library} href="/classes" />
                </div>
            )}
            {role === "student" && (
                <div className="stat-grid">
                    <StatCard label="Today" value={todays.length} note={todays.length === 1 ? "lesson today" : "lessons today"} icon={CalendarDays} />
                    <StatCard label="Next lesson" value={next ? formatShortDate(next.lesson_date) : "—"} note={next ? `${next.title} · ${next.start_time.slice(0, 5)}` : "Nothing coming up"} icon={BookOpen} />
                    <StatCard label="Homework" value={lessons.filter((l) => l.lesson_date >= today && l.homework).length} note="set for upcoming lessons" icon={ClipboardList} href="/homework" />
                </div>
            )}
            <Planner
                key={monthKey(year, monthNumber - 1)}
                year={year}
                month={monthNumber - 1}
                today={today}
                lessons={lessons}
                canEdit={role === "teacher"}
                classSubjects={classSubjects}
            />
        </div>
    );
}
