export const ACCESS_COOKIE = "lesson_planner_access";
export const REFRESH_COOKIE = "lesson_planner_refresh";
export const ACCESS_MAX_AGE = 15 * 60;
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export const API_BASE_URL = (process.env.API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export type UserProfile = {
    id: string;
    login_id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    role: "admin" | "teacher" | "student";
    must_change_password: boolean;
    avatar_url: string | null;
};

export type TokenResponse = {
    access_token: string;
    refresh_token: string;
    token_type: "bearer";
    must_change_password: boolean;
};

export function roleForPortal(portal: string) {
    if (portal === "admin") return "admin";
    if (portal === "teachers") return "teacher";
    if (portal === "students") return "student";
    return null;
}
