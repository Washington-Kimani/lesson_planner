const SCHOOL_TZ = "Africa/Nairobi";

const pad = (n: number) => String(n).padStart(2, "0");

export const toISODate = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "Today" in the school's timezone, so server and browser agree
export const todayISO = () =>
    new Date().toLocaleDateString("en-CA", { timeZone: SCHOOL_TZ }); // YYYY-MM-DD

export const monthKey = (year: number, month: number) => `${year}-${pad(month + 1)}`;

/** Whole weeks (Sunday first) covering the month, as Date objects. */
export function buildMonthGrid(year: number, month: number): Date[] {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;
    return Array.from(
        { length: cells },
        (_, i) => new Date(year, month, 1 - first.getDay() + i)
    );
}

export function endTime(start: string, minutes: number): string {
    const [h, m] = start.split(":").map(Number);
    const total = h * 60 + m + minutes;
    return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h && m) return `${h}h ${m}m`;
    return h ? `${h} hour${h > 1 ? "s" : ""}` : `${m} min`;
}

export const formatLongDate = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(`${iso}T00:00:00`)
    );

export const formatMonthTitle = (year: number, month: number) =>
    new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
        new Date(year, month, 1)
    );

// Stable colour per subject (and per avatar): the accent violet plus the reference palette's navy, amber, plum and teal
const PALETTE = ["#6868fd", "#d4830b", "#057e87", "#0b5288", "#453b78", "#8687fe"];
export function subjectColor(name: string): string {
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return PALETTE[hash % PALETTE.length];
}

export const formatShortDate = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(
        new Date(`${iso}T00:00:00`)
    );

export const formatStamp = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
