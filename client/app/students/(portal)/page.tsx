import { Planner } from "@/app/components/Planner";
import { monthKey, todayISO } from "@/lib/dates";
import { getLessonsForMonth } from "@/lib/lessons";

export const metadata = {
    title: "Student timetable · Lesson Planner",
    description: "See your lessons and what’s coming up in class.",
};

export default async function StudentHome({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
    const { month } = await searchParams;
    const today = todayISO();
    const valid = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : today.slice(0, 7);
    const [year, monthNumber] = valid.split("-").map(Number);
    const lessons = (await getLessonsForMonth(year, monthNumber - 1)).filter((lesson) => lesson.status === "published");

    return <Planner
        key={monthKey(year, monthNumber - 1)}
        year={year}
        month={monthNumber - 1}
        today={today}
        lessons={lessons}
        canEdit={false}
    />;
}
