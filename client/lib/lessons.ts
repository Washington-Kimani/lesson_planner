import { monthKey } from "@/lib/dates";
import type { Lesson } from "@/lib/types";

// day, start, minutes, subject, class, title, status
const SAMPLE: [number, string, number, string, string, string, Lesson["status"]][] = [
    [3, "10:00", 40, "Mathematics", "Grade 7 East", "Number patterns", "published"],
    [8, "09:00", 75, "English", "Grade 7 East", "Descriptive writing", "published"],
    [8, "10:00", 60, "Mathematics", "Grade 7 East", "Introduction to fractions", "published"],
    [8, "13:00", 120, "Science", "Grade 8 West", "Lab: states of matter", "draft"],
    [12, "08:00", 40, "English", "Grade 7 East", "Reading comprehension", "published"],
    [15, "11:30", 40, "Science", "Grade 8 West", "Heat transfer", "published"],
    [22, "09:00", 40, "Mathematics", "Grade 7 East", "Comparing fractions", "draft"],
];

// Mock data until the API is wired in. Keep this signature: the real version
// will call GET /lessons?date_from=...&date_to=... with the user's token.
export async function getLessonsForMonth(year: number, month: number): Promise<Lesson[]> {
    const prefix = monthKey(year, month);
    return SAMPLE.map(([day, start, minutes, subject, cls, title, status], i) => ({
        id: `sample-${prefix}-${i}`,
        class_subject_id: "sample",
        title,
        objectives: null,
        content: null,
        materials: null,
        homework: null,
        lesson_date: `${prefix}-${String(day).padStart(2, "0")}`,
        start_time: `${start}:00`,
        duration_minutes: minutes,
        status,
        subject_name: subject,
        class_name: cls,
    }));
}