import { apiGet } from "@/lib/api";
import { subjectColor } from "@/lib/dates";
import type { ClassSubject } from "@/lib/types";

export const metadata = { title: "My classes · Tutorium" };

export default async function StudentClasses() {
    const items = await apiGet<ClassSubject[]>("/class-subjects");
    const byClass = new Map<string, ClassSubject[]>();
    for (const item of items) byClass.set(item.class_name, [...(byClass.get(item.class_name) ?? []), item]);

    return (
        <div>
            <div className="page-head">
                <div><span className="eyebrow">YOUR CLASSES</span><h2>My classes</h2><p>Your subjects and who teaches them.</p></div>
            </div>
            {byClass.size === 0 ? <p className="empty">You haven’t been added to a class yet. Ask your teacher.</p> : (
                <div className="grid gap-4 md:grid-cols-2">
                    {[...byClass.entries()].map(([className, subjects]) => (
                        <section key={className} className="glass panel">
                            <h3>{className}</h3>
                            <div className="mt-3">
                                {subjects.map((item) => (
                                    <div className="link-row" key={item.id}>
                                        <span className="flex items-center gap-2 font-semibold"><i className="block size-2.5 rounded-full" style={{ background: subjectColor(item.subject_name) }} />{item.subject_name}</span>
                                        <span className="text-muted">{item.teacher_name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
