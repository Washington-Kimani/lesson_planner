import { NextRequest, NextResponse } from "next/server";
import {
    ACCESS_COOKIE, ACCESS_MAX_AGE, API_BASE_URL, REFRESH_COOKIE, REFRESH_MAX_AGE,
    type TokenResponse,
} from "@/lib/auth";

// Only these backend resources can be reached from the browser. Auth has its own routes.
const ALLOWED = [
    "stats", "account-requests", "teachers", "students", "classes",
    "subjects", "class-subjects", "lessons", "users/me",
];
const SEGMENT = /^[A-Za-z0-9_-]+$/;

async function forward(request: NextRequest, context: RouteContext<"/api/proxy/[...path]">) {
    const { path } = await context.params;
    const target = path.join("/");
    if (!path.every((part) => SEGMENT.test(part)) || !ALLOWED.some((p) => target === p || target.startsWith(`${p}/`))) {
        return NextResponse.json({ detail: "Not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type");
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const body = hasBody ? await request.arrayBuffer() : undefined;
    const call = (token: string) => fetch(`${API_BASE_URL}/${target}${request.nextUrl.search}`, {
        method: request.method,
        headers: { Authorization: `Bearer ${token}`, ...(contentType && body?.byteLength ? { "Content-Type": contentType } : {}) },
        body: body?.byteLength ? body : undefined,
        cache: "no-store",
    });

    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
    let rotated: TokenResponse | null = null;
    let upstream: Response | null = null;

    try {
        if (accessToken) upstream = await call(accessToken);
        // The access token only lives 15 minutes; quietly swap it using the refresh token and retry once
        if ((!upstream || upstream.status === 401) && refreshToken) {
            const refreshed = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken }),
                cache: "no-store",
            });
            if (refreshed.ok) {
                rotated = await refreshed.json() as TokenResponse;
                accessToken = rotated.access_token;
                upstream = await call(accessToken);
            }
        }
    } catch {
        return NextResponse.json({ detail: "We couldn’t reach the server. Check your connection and try again." }, { status: 503 });
    }

    if (!upstream || upstream.status === 401) {
        const ended = NextResponse.json({ detail: "Your session ended. Sign in again to continue." }, { status: 401 });
        ended.cookies.delete(ACCESS_COOKIE);
        ended.cookies.delete(REFRESH_COOKIE);
        return ended;
    }

    const payload = await upstream.arrayBuffer();
    const response = new NextResponse(payload.byteLength ? payload : null, {
        status: upstream.status,
        headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
    });
    if (rotated) {
        const secure = process.env.NODE_ENV === "production";
        response.cookies.set(ACCESS_COOKIE, rotated.access_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: ACCESS_MAX_AGE });
        response.cookies.set(REFRESH_COOKIE, rotated.refresh_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: REFRESH_MAX_AGE });
    }
    return response;
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
