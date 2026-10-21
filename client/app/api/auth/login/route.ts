import { NextRequest, NextResponse } from "next/server";
import {
    ACCESS_COOKIE, ACCESS_MAX_AGE, API_BASE_URL, REFRESH_COOKIE, REFRESH_MAX_AGE,
    roleForPortal,
    type TokenResponse, type UserProfile,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
    const form = await request.formData();
    const loginId = String(form.get("login_id") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const portal = String(form.get("portal") ?? "");

    if (!loginId) return NextResponse.json({ error: "empty_login" }, { status: 400 });
    if (!password) return NextResponse.json({ error: "empty_password" }, { status: 400 });
    const expectedRole = roleForPortal(portal);
    if (!expectedRole) return NextResponse.json({ error: "wrong_portal" }, { status: 400 });

    let tokenResponse: Response;
    try {
        tokenResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ username: loginId, password }),
            cache: "no-store",
        });
    } catch {
        return NextResponse.json({ error: "connection" }, { status: 503 });
    }

    if (!tokenResponse.ok) {
        if (tokenResponse.status === 429) return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
        return NextResponse.json({ error: "invalid_credentials" }, { status: tokenResponse.status });
    }

    const tokens = await tokenResponse.json() as TokenResponse;
    let profileResponse: Response;
    try {
        profileResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
            cache: "no-store",
        });
    } catch {
        return NextResponse.json({ error: "connection" }, { status: 503 });
    }

    if (!profileResponse.ok) return NextResponse.json({ error: "connection" }, { status: 502 });
    const profile = await profileResponse.json() as UserProfile;
    if (profile.role !== expectedRole) {
        const revoke = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: tokens.refresh_token }),
            cache: "no-store",
        }).catch((error: unknown) => {
            console.error("Could not revoke token after wrong-portal login", error);
            return null;
        });
        if (revoke && !revoke.ok) console.error("Could not revoke token after wrong-portal login", revoke.status);
        return NextResponse.json({ error: "wrong_portal" }, { status: 403 });
    }

    const response = NextResponse.json({ must_change_password: tokens.must_change_password });
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
        httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: ACCESS_MAX_AGE,
    });
    response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
        httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: REFRESH_MAX_AGE,
    });
    return response;
}
