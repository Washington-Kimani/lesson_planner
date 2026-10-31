import { apiGet } from "@/lib/api";
import { formatLongDate, subjectColor, todayISO } from "@/lib/dates";
import type { Lesson } from "@/lib/types";

export const metadata = { title: "Homework · Tutorium" };

export default async function Homework() {
    const today = todayISO();
    const lessons = (await apiGet<Lesson[]>(`/lessons?date_from=${today}&limit=200`))
        .filter((lesson) => lesson.status === "published" && lesson.homework)
        .sort((a, b) => `${a.lesson_date}${a.start_time}`.localeCompare(`${b.lesson_date}${b.start_time}`));

    const byDate = new Map<string, Lesson[]>();
    for (const lesson of lessons) byDate.set(lesson.lesson_date, [...(byDate.get(lesson.lesson_date) ?? []), lesson]);

    return (
        <div>
            <div className="page-head">
                <div><span className="eyebrow">HOMEWORK</span><h2>Homework</h2><p>Work your teachers have set for lessons coming up.</p></div>
            </div>
            {lessons.length === 0 ? <p className="empty">No homework set for upcoming lessons. Enjoy it while it lasts.</p> : (
                <div className="flex flex-col gap-5">
                    {[...byDate.entries()].map(([date, items]) => (
                        <section key={date}>
                            <h3 className="mb-2 text-sm font-bold text-muted">{date === today ? "Today · " : ""}{formatLongDate(date)}</h3>
                            <div className="flex flex-col gap-3">
                                {items.map((lesson) => (
                                    <article key={lesson.id} className="glass panel">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3>{lesson.subject_name}</h3>
                                                <p className="panel-sub flex items-center gap-2"><i className="block size-2 rounded-full" style={{ background: subjectColor(lesson.subject_name) }} />{lesson.title} · {lesson.class_name}</p>
                                            </div>
                                            {lesson.teacher_name && <span className="badge badge-muted">{lesson.teacher_name}</span>}
                                        </div>
                                        <p className="detail-block !mt-3 text-sm text-body" style={{ whiteSpace: "pre-wrap" }}>{lesson.homework}</p>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
