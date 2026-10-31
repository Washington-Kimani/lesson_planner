import { CalendarView } from "@/app/components/CalendarView";

export const metadata = { title: "School calendar · Tutorium" };

export default async function AdminCalendar({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
    const { month } = await searchParams;
    return <CalendarView month={month} role="admin" />;
}
