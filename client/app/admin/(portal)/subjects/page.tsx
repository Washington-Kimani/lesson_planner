import { SubjectsManager } from "@/app/components/SubjectsManager";
import { apiGet } from "@/lib/api";
import type { Subject } from "@/lib/types";

export const metadata = { title: "Subjects · Tutorium" };

export default async function Subjects() {
    const subjects = await apiGet<Subject[]>("/subjects");
    return (
        <div>
            <div className="page-head">
                <div><span className="eyebrow">SCHOOL SETUP</span><h2>Subjects</h2><p>The subjects teachers can plan lessons for.</p></div>
            </div>
            <SubjectsManager subjects={subjects} />
        </div>
    );
}
