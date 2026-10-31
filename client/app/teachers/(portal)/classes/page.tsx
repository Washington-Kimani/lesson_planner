import { ClassesView } from "@/app/components/ClassesView";

export const metadata = { title: "My classes · Tutorium" };

export default function Classes() {
    return <ClassesView canManage={false} />;
}
