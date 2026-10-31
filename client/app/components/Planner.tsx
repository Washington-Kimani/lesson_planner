"use client";

import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { LessonDetail } from "@/app/components/LessonDetail";
import { LessonForm } from "@/app/components/LessonForm";
import {
    buildMonthGrid, endTime, formatDuration, formatLongDate, formatMonthTitle,
    monthKey, subjectColor, toISODate,
} from "@/lib/dates";
import type { ClassSubject, Lesson } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
    year: number;
    month: number; // 0-11
    today: string; // YYYY-MM-DD
    lessons: Lesson[];
    canEdit: boolean;
    classSubjects?: ClassSubject[]; // what a teacher can plan lessons for
}

type Dialog =
    | { kind: "view"; lesson: Lesson }
    | { kind: "form"; lesson?: Lesson; date?: string };

export function Planner({ year, month, today, lessons, canEdit, classSubjects = [] }: Props) {
    const router = useRouter();
    const key = monthKey(year, month);
    const [selected, setSelected] = useState(today.startsWith(key) ? today : `${key}-01`);
    const [dialog, setDialog] = useState<Dialog | null>(null);

    const byDate = useMemo(() => {
        const map = new Map<string, Lesson[]>();
        for (const lesson of lessons) {
            const list = map.get(lesson.lesson_date) ?? [];
            list.push(lesson);
            map.set(lesson.lesson_date, list);
        }
        for (const list of map.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time));
        return map;
    }, [lessons]);

    const cells = buildMonthGrid(year, month);
    const selectedLessons = byDate.get(selected) ?? [];
    const canPlan = canEdit && classSubjects.length > 0;

    function go(delta: number) {
        const d = new Date(year, month + delta, 1);
        router.push(`?month=${monthKey(d.getFullYear(), d.getMonth())}`);
    }

    function goToday() {
        if (today.startsWith(key)) setSelected(today);
        else router.push(`?month=${today.slice(0, 7)}`);
    }

    return (
        <div className="flex flex-col gap-4 xl:flex-row">
            {/* Calendar */}
            <section className="glass flex-1 rounded-2xl p-4 lg:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold tracking-tight">{formatMonthTitle(year, month)}</h2>
                    <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-sm" onClick={goToday}>Today</button>
                        <button type="button" aria-label="Previous month" onClick={() => go(-1)} className="icon-button !size-8 !rounded-full">
                            <ChevronLeft className="size-4" />
                        </button>
                        <button type="button" aria-label="Next month" onClick={() => go(1)} className="icon-button !size-8 !rounded-full">
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="grid min-w-160 grid-cols-7 gap-2">
                        {WEEKDAYS.map((d) => (
                            <div key={d} className="px-2 pb-1 text-xs font-semibold text-muted">{d}</div>
                        ))}

                        {cells.map((date) => {
                            const iso = toISODate(date);
                            const inMonth = date.getMonth() === month;
                            const items = byDate.get(iso) ?? [];
                            const isToday = iso === today;
                            const isSelected = iso === selected;

                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    onClick={() => setSelected(iso)}
                                    aria-pressed={isSelected}
                                    className={[
                                        "flex min-h-24 flex-col items-start gap-1 rounded-xl border p-2 text-left transition",
                                        inMonth ? "bg-cell hover:bg-accent-soft" : "bg-cell-alt opacity-50",
                                        isSelected ? "border-accent ring-2 ring-accent/20" : "border-line",
                                    ].join(" ")}
                                >
                                    <span className={`grid size-7 place-items-center rounded-full text-sm font-semibold leading-none ${isToday ? "bg-accent text-white" : ""}`}>
                                        {date.getDate()}
                                    </span>
                                    {items.slice(0, 2).map((l) => (
                                        <span
                                            key={l.id}
                                            className={`flex w-full items-center gap-1 text-[10px] text-body ${l.status === "draft" ? "opacity-60" : ""}`}
                                        >
                                            <i className="block h-2.5 w-0.5 shrink-0 rounded-full" style={{ background: subjectColor(l?.subject_name) }} />
                                            <span className="truncate">{l.title}</span>
                                        </span>
                                    ))}
                                    {items.length > 2 && <span className="text-[10px] text-muted">+{items.length - 2} more</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Schedule for the selected day */}
            <aside className="glass flex w-full shrink-0 flex-col gap-4 rounded-2xl p-5 xl:w-80">
                <header className="flex items-start justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-semibold">Scheduled</h2>
                        <p className="text-xs text-muted">{formatLongDate(selected)}</p>
                    </div>
                    {canEdit && (
                        <button type="button" className="btn btn-primary btn-sm" disabled={!canPlan} onClick={() => setDialog({ kind: "form", date: selected })}>
                            <Plus size={14} /> Add lesson
                        </button>
                    )}
                </header>

                {canEdit && classSubjects.length === 0 && (
                    <p className="alert alert-warn">
                        You’re not assigned to any class and subject yet. Ask an administrator to set that up, then you can plan lessons here.
                    </p>
                )}

                {selectedLessons.length === 0 && (
                    <p className="empty">No lessons planned for this day.</p>
                )}

                {selectedLessons.map((l) => {
                    const start = l.start_time.slice(0, 5);
                    return (
                        <button
                            type="button"
                            key={l.id}
                            onClick={() => setDialog({ kind: "view", lesson: l })}
                            className="rounded-xl border border-line bg-cell p-4 text-left transition hover:border-accent-line hover:bg-accent-soft"
                        >
                            <div className="mb-3 h-1.5 w-full rounded-full" style={{ background: subjectColor(l?.subject_name) }} />
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold">{l.title}</h3>
                                {canEdit && l.status === "draft" && <span className="badge badge-warn">Draft</span>}
                            </div>
                            <p className="text-xs text-muted">{l.subject_name} · {l.class_name}</p>
                            <div className="mt-4 flex items-center justify-between text-xs text-muted">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="size-3.5" />
                                    {start} – {endTime(start, l.duration_minutes)}
                                </span>
                                <span>{formatDuration(l.duration_minutes)}</span>
                            </div>
                        </button>
                    );
                })}
            </aside>

            {dialog?.kind === "view" && (
                <LessonDetail
                    lesson={dialog.lesson}
                    canEdit={canEdit}
                    onEdit={() => setDialog({ kind: "form", lesson: dialog.lesson })}
                    onClose={() => setDialog(null)}
                />
            )}
            {dialog?.kind === "form" && (
                <LessonForm lesson={dialog.lesson} date={dialog.date} classSubjects={classSubjects} onClose={() => setDialog(null)} />
            )}
        </div>
    );
}
