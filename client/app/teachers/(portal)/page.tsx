import { CalendarView } from "@/app/components/CalendarView";

export const metadata = {
    title: "Teacher calendar · Tutorium",
    description: "Plan and manage your lessons.",
};

export default async function TeacherHome({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
    const { month } = await searchParams;
    return <CalendarView month={month} role="teacher" />;
}
