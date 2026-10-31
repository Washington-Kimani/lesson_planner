import { ClassesManager } from "@/app/components/ClassesManager";
import { apiGet } from "@/lib/api";
import type { ClassRoom, ClassSubject } from "@/lib/types";

export async function ClassesView({ canManage }: { canManage: boolean }) {
    const [classes, classSubjects] = await Promise.all([
        apiGet<ClassRoom[]>("/classes"),
        apiGet<ClassSubject[]>("/class-subjects"),
    ]);
    return (
        <div>
            <div className="page-head">
                <div><span className="eyebrow">{canManage ? "SCHOOL SETUP" : "YOUR CLASSES"}</span><h2>{canManage ? "Classes" : "My classes"}</h2><p>{canManage ? "Create classes, then add students and assign teachers." : "The classes you teach and the students in them."}</p></div>
            </div>
            <ClassesManager classes={classes} classSubjects={classSubjects} canManage={canManage} />
        </div>
    );
}
