import { ClassesView } from "@/app/components/ClassesView";

export const metadata = { title: "My classes · Bellpath" };

export default function Classes() {
    return <ClassesView canManage={false} portal="teachers" />;
}
