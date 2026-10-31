import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/auth";

type Body = Record<string, unknown>;

const LIMITS: Record<string, number> = {
    first_name: 80, last_name: 80, email: 254, phone: 30, subjects: 200,
    department: 100, qualification: 150, employee_number: 50, message: 1000,
};
const REQUIRED = ["first_name", "last_name", "email", "phone", "subjects"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
    let raw: Body;
    try {
        raw = await request.json() as Body;
    } catch {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const clean: Record<string, string | null> = {};
    for (const [key, max] of Object.entries(LIMITS)) {
        const value = typeof raw[key] === "string" ? (raw[key] as string).trim() : "";
        if (value.length > max) return NextResponse.json({ error: "invalid" }, { status: 400 });
        clean[key] = value || null;
    }
    if (REQUIRED.some((key) => !clean[key]) || !EMAIL.test(clean.email ?? "") || raw.consent !== true) {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    let result: Response;
    try {
        result = await fetch(`${API_BASE_URL}/account-requests`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Lets the API rate-limit by the visitor rather than by this server
                "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
            },
            body: JSON.stringify(clean),
            cache: "no-store",
        });
    } catch {
        return NextResponse.json({ error: "connection" }, { status: 503 });
    }

    if (result.ok) return NextResponse.json({ ok: true }, { status: 201 });
    if (result.status === 409) return NextResponse.json({ error: "duplicate" }, { status: 409 });
    if (result.status === 429) return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
    if (result.status === 422) return NextResponse.json({ error: "invalid" }, { status: 400 });
    return NextResponse.json({ error: "connection" }, { status: 502 });
}
