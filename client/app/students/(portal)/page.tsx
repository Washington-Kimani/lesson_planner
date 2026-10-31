import { CalendarView } from "@/app/components/CalendarView";

export const metadata = {
    title: "Student timetable · Tutorium",
    description: "See your lessons and what’s coming up in class.",
};

export default async function StudentHome({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
    const { month } = await searchParams;
    return <CalendarView month={month} role="student" />;
}
