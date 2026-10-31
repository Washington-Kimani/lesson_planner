import { LessonsList } from "@/app/components/LessonsList";
import { apiGet } from "@/lib/api";
import { todayISO } from "@/lib/dates";
import { searchLessons } from "@/lib/lessons";
import type { ClassSubject } from "@/lib/types";

type Role = "teacher" | "student" | "admin";
export type LessonFilters = { q?: string; status?: string; class_subject_id?: string; when?: string };

function yesterday(today: string) {
    const date = new Date(`${today}T00:00:00`);
    date.setDate(date.getDate() - 1);
    return date.toLocaleDateString("en-CA");
}

export async function LessonsPage({ filters, role }: { filters: LessonFilters; role: Role }) {
    const today = todayISO();
    const when = ["upcoming", "past", "all"].includes(filters.when ?? "") ? filters.when! : role === "student" ? "upcoming" : "all";
    const status = role !== "student" && ["draft", "published"].includes(filters.status ?? "") ? filters.status : undefined;

    const [fetched, classSubjects] = await Promise.all([
        searchLessons({
            q: filters.q?.trim() || undefined,
            status,
            class_subject_id: filters.class_subject_id || undefined,
            date_from: when === "upcoming" ? today : undefined,
            date_to: when === "past" ? yesterday(today) : undefined,
        }),
        apiGet<ClassSubject[]>("/class-subjects"),
    ]);
    const lessons = (role === "student" ? fetched.filter((l) => l.status === "published") : fetched)
        .sort((a, b) => `${a.lesson_date}${a.start_time}`.localeCompare(`${b.lesson_date}${b.start_time}`) * (when === "past" ? -1 : 1));

    const intro = role === "teacher" ? "Search and manage every lesson you’ve planned."
        : role === "student" ? "Everything your teachers have published for your classes."
            : "Every lesson planned across the school.";

    return (
        <div>
            <div className="page-head">
                <div><span className="eyebrow">LESSONS</span><h2>{role === "student" ? "My lessons" : "Lessons"}</h2><p>{intro}</p></div>
            </div>
            <form className="toolbar" action="/lessons">
                <input className="input grow" name="q" defaultValue={filters.q ?? ""} placeholder="Search by title, subject or class" aria-label="Search lessons" />
                <select className="input" name="when" defaultValue={when} aria-label="When">
                    <option value="upcoming">Upcoming</option><option value="past">Past</option><option value="all">All dates</option>
                </select>
                <select className="input" name="class_subject_id" defaultValue={filters.class_subject_id ?? ""} aria-label="Class and subject">
                    <option value="">All classes and subjects</option>
                    {classSubjects.map((item) => <option key={item.id} value={item.id}>{item.class_name} · {item.subject_name}</option>)}
                </select>
                {role !== "student" && (
                    <select className="input" name="status" defaultValue={status ?? ""} aria-label="Status">
                        <option value="">Drafts and published</option><option value="draft">Drafts</option><option value="published">Published</option>
                    </select>
                )}
                <button className="btn btn-primary">Apply</button>
            </form>
            <LessonsList
                lessons={lessons}
                canEdit={role === "teacher"}
                showTeacher={role !== "teacher"}
                classSubjects={role === "teacher" ? classSubjects : []}
                emptyText={filters.q ? "No lessons match your search." : "No lessons to show yet."}
            />
        </div>
    );
}
