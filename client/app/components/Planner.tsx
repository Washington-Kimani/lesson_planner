"use client";

import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
    buildMonthGrid, endTime, formatDuration, formatLongDate, formatMonthTitle,
    monthKey, subjectColor, toISODate,
} from "@/lib/dates";
import type { Lesson } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
    year: number;
    month: number; // 0-11
    today: string; // YYYY-MM-DD
    lessons: Lesson[];
    canEdit: boolean;
}

export function Planner({ year, month, today, lessons }: Props) {
    const router = useRouter();
    const key = monthKey(year, month);
    const [selected, setSelected] = useState(today.startsWith(key) ? today : `${key}-01`);

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

    function go(delta: number) {
        const d = new Date(year, month + delta, 1);
        router.push(`?month=${monthKey(d.getFullYear(), d.getMonth())}`);
    }

    return (
        <div className="flex flex-col gap-4 xl:flex-row">
            {/* Calendar */}
            <section className="glass flex-1 rounded-3xl p-4 lg:p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{formatMonthTitle(year, month)}</h2>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            aria-label="Previous month"
                            onClick={() => go(-1)}
                            className="grid size-8 place-items-center rounded-full border border-line bg-cell hover:bg-accent-soft"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next month"
                            onClick={() => go(1)}
                            className="grid size-8 place-items-center rounded-full border border-line bg-cell hover:bg-accent-soft"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="grid min-w-160 grid-cols-7 gap-2">
                        {WEEKDAYS.map((d) => (
                            <div key={d} className="px-2 pb-1 text-xs text-muted">
                                {d}
                            </div>
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
                                    className={[
                                        "flex min-h-24 flex-col items-start gap-1 rounded-2xl border p-2 text-left transition",
                                        inMonth ? "border-line bg-cell hover:bg-accent-soft" : "border-transparent bg-cell opacity-40",
                                        isToday ? "bg-linear-to-b from-accent to-accent-soft text-white" : "",
                                        isSelected ? "border-dashed border-accent!" : "",
                                    ].join(" ")}
                                >
                                    <span className="text-lg font-medium leading-none">{date.getDate()}</span>
                                    {items.slice(0, 2).map((l) => (
                                        <span
                                            key={l.id}
                                            className={`flex w-full items-center gap-1 text-[10px] ${
                                                isToday ? "text-white/90" : "text-muted"
                                            } ${l.status === "draft" ? "opacity-60" : ""}`}
                                        >
                      <i
                          className="block h-2.5 w-0.5 shrink-0 rounded-full"
                          style={{ background: subjectColor(l.subject_name) }}
                      />
                      <span className="truncate">{l.title}</span>
                    </span>
                                    ))}
                                    {items.length > 2 && (
                                        <span className="text-[10px] text-muted">+{items.length - 2} more</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Schedule for the selected day */}
            <aside className="glass flex w-full shrink-0 flex-col gap-4 rounded-3xl p-5 xl:w-80">
                <header>
                    <h2 className="text-lg font-semibold">Scheduled</h2>
                    <p className="text-xs text-muted">{formatLongDate(selected)}</p>
                </header>

                {selectedLessons.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
                        No lessons planned for this day.
                    </p>
                )}

                {selectedLessons.map((l) => {
                    const start = l.start_time.slice(0, 5);
                    return (
                        <article key={l.id} className="rounded-2xl border border-line bg-cell p-4">
                            <div
                                className="mb-3 h-1.5 w-full rounded-full"
                                style={{ background: subjectColor(l.subject_name) }}
                            />
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold">{l.title}</h3>
                                {l.status === "draft" && (
                                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] text-accent">
                    Draft
                  </span>
                                )}
                            </div>
                            <p className="text-xs text-muted">
                                {l.subject_name} · {l.class_name}
                            </p>
                            <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                    {start} – {endTime(start, l.duration_minutes)}
                </span>
                                <span>{formatDuration(l.duration_minutes)}</span>
                            </div>
                        </article>
                    );
                })}
            </aside>
        </div>
    );
}