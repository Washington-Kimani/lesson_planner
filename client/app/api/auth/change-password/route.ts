import { NextRequest, NextResponse } from "next/server";
import {
    ACCESS_COOKIE, ACCESS_MAX_AGE, API_BASE_URL, REFRESH_COOKIE, REFRESH_MAX_AGE,
    type TokenResponse,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
    const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
    if (!accessToken) return NextResponse.json({ error: "session_ended" }, { status: 401 });

    const body = await request.json() as { current_password?: string; new_password?: string };
    if (!body.current_password || !body.new_password) {
        return NextResponse.json({ error: "required_fields" }, { status: 400 });
    }
    if (body.new_password.length < 10 || body.new_password.length > 128) {
        return NextResponse.json({ error: "password_length" }, { status: 400 });
    }

    let result: Response;
    try {
        result = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
        });
    } catch {
        return NextResponse.json({ error: "connection" }, { status: 503 });
    }
    if (!result.ok) {
        return NextResponse.json({ error: result.status === 401 ? "session_ended" : "password_update_failed" }, { status: result.status });
    }

    const tokens = await result.json() as TokenResponse;
    const response = NextResponse.json({ ok: true });
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
        httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: ACCESS_MAX_AGE,
    });
    response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
        httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: REFRESH_MAX_AGE,
    });
    return response;
}
