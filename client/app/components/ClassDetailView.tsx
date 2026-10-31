import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ClassRoster } from "@/app/components/ClassRoster";
import { apiGet } from "@/lib/api";
import type { ClassDetail, Student } from "@/lib/types";

export async function ClassDetailView({ id }: { id: string }) {
    const [detail, students] = await Promise.all([
        apiGet<ClassDetail>(`/classes/${encodeURIComponent(id)}`),
        apiGet<Student[]>("/students"),
    ]);
    return (
        <div>
            <Link href="/classes" className="text-link mb-3"><ArrowLeft size={14} /> All classes</Link>
            <div className="page-head">
                <div><span className="eyebrow">{detail.academic_year}</span><h2>{detail.name}</h2><p>{detail.student_count} {detail.student_count === 1 ? "student" : "students"} · {detail.subjects.length} {detail.subjects.length === 1 ? "subject" : "subjects"}</p></div>
            </div>
            <ClassRoster detail={detail} allStudents={students} />
        </div>
    );
}
