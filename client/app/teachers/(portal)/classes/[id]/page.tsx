import { ClassDetailView } from "@/app/components/ClassDetailView";

export const metadata = { title: "Class · Tutorium" };

export default async function TeacherClass({ params }: { params: Promise<{ id: string }> }) {
    return <ClassDetailView id={(await params).id} />;
}
