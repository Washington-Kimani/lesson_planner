import { ClassesView } from "@/app/components/ClassesView";

export const metadata = { title: "Classes · Bellpath" };

export default function AdminClasses() {
    return <ClassesView canManage portal="admin" />;
}
