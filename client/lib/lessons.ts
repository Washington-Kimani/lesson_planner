import { apiGet } from "@/lib/api";
import { buildMonthGrid, toISODate } from "@/lib/dates";
import type { Lesson } from "@/lib/types";

// The API scopes results to the signed-in user: teachers get their own lessons,
// students get published lessons for their classes, administrators get everything.
export async function getLessonsForMonth(year: number, month: number): Promise<Lesson[]> {
    // Fetch the whole visible grid, so days from the neighbouring months show their lessons too
    const cells = buildMonthGrid(year, month);
    const from = toISODate(cells[0]);
    const to = toISODate(cells[cells.length - 1]);
    return apiGet<Lesson[]>(`/lessons?date_from=${from}&date_to=${to}`);
}

export async function searchLessons(params: Record<string, string | undefined>): Promise<Lesson[]> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    query.set("limit", "200");
    return apiGet<Lesson[]>(`/lessons?${query}`);
}
