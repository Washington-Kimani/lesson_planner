import { LessonsPage, type LessonFilters } from "@/app/components/LessonsPage";

export const metadata = { title: "Lessons · Tutorium" };

export default async function Lessons({ searchParams }: { searchParams: Promise<LessonFilters> }) {
    return <LessonsPage filters={await searchParams} role="admin" />;
}
