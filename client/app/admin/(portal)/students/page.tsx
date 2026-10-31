import { StudentsManager } from "@/app/components/StudentsManager";
import { apiGet } from "@/lib/api";
import type { ClassRoom, Student } from "@/lib/types";

export const metadata = { title: "Students · Tutorium" };

export default async function Students() {
    const [students, classes] = await Promise.all([apiGet<Student[]>("/students"), apiGet<ClassRoom[]>("/classes")]);
    return (
        <div>
            <div className="page-head">
                <div><span className="eyebrow">PEOPLE</span><h2>Students</h2><p>Create student accounts, update their details and reset passwords. Login details are emailed to a parent or guardian.</p></div>
            </div>
            <StudentsManager students={students} classes={classes} isAdmin={true} />
        </div>
    );
}
