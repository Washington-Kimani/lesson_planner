import { AssignmentsManager } from "@/app/components/AssignmentsManager";
import { apiGet } from "@/lib/api";
import type { ClassRoom, ClassSubject, Subject, Teacher } from "@/lib/types";

export const metadata = { title: "Teaching assignments · Tutorium" };

export default async function Assignments() {
    const [assignments, classes, subjects, teachers] = await Promise.all([
        apiGet<ClassSubject[]>("/class-subjects"),
        apiGet<ClassRoom[]>("/classes"),
        apiGet<Subject[]>("/subjects"),
        apiGet<Teacher[]>("/teachers"),
    ]);
    return (
        <div>
            <div className="page-head">
                <div><span className="eyebrow">SCHOOL SETUP</span><h2>Teaching assignments</h2><p>Connect teachers and subjects to the right classes.</p></div>
            </div>
            <AssignmentsManager assignments={assignments} classes={classes} subjects={subjects} teachers={teachers} />
        </div>
    );
}
