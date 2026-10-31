import { TeachersManager } from "@/app/components/TeachersManager";
import { apiGet } from "@/lib/api";
import type { Teacher } from "@/lib/types";

export const metadata = { title: "Teachers · Tutorium" };

export default async function Teachers() {
    const teachers = await apiGet<Teacher[]>("/teachers");
    return (
        <div>
            <div className="page-head">
                <div><span className="eyebrow">PEOPLE</span><h2>Teachers</h2><p>Create teacher accounts, reset passwords and deactivate people who have left.</p></div>
            </div>
            <TeachersManager teachers={teachers} />
        </div>
    );
}
