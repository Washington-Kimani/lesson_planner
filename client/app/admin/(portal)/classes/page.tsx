import { ClassesView } from "@/app/components/ClassesView";

export const metadata = { title: "Classes · Tutorium" };

export default function AdminClasses() {
    return <ClassesView canManage />;
}
