import { NextRequest, NextResponse } from "next/server";
import {
    ACCESS_COOKIE, ACCESS_MAX_AGE, API_BASE_URL, REFRESH_COOKIE, REFRESH_MAX_AGE,
    type TokenResponse, type UserProfile,
} from "@/lib/auth";

const PORTALS: Record<string, string> = {
    admin: "/admin",
    teachers: "/teachers",
    students: "/students",
};
const ROLE_FOR_PORTAL = { admin: "admin", teachers: "teacher", students: "student" } as const;
const PORTAL_FOR_ROLE = { admin: "admin", teacher: "teachers", student: "students" } as const;

async function currentProfile(accessToken: string) {
    return fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
    });
}

function portalLogin(request: NextRequest, base: string, status: "session" | "connection") {
    const url = request.nextUrl.clone();
    url.pathname = `${base}/login`;
    url.search = `?status=${status}`;
    return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const portal = Object.keys(PORTALS).find(
        (name) => pathname === PORTALS[name] || pathname.startsWith(`${PORTALS[name]}/`)
    );
    const base = portal ? PORTALS[portal] : undefined;

    if (!base || !portal) return NextResponse.next();

    const portalPath = pathname.slice(base.length) || "/";
    const loginPage = portalPath === "/login";
    if (!loginPage) {
        let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
        const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
        let profileResponse: Response | null = null;
        let rotatedTokens: TokenResponse | null = null;

        if (accessToken) {
            try {
                profileResponse = await currentProfile(accessToken);
            } catch {
                return portalLogin(request, base, "connection");
            }
            if (profileResponse.status !== 401 && !profileResponse.ok) {
                return portalLogin(request, base, "connection");
            }
        }

        if (!profileResponse || profileResponse.status === 401) {
            if (!refreshToken) {
                const response = portalLogin(request, base, "session");
                response.cookies.delete(ACCESS_COOKIE);
                response.cookies.delete(REFRESH_COOKIE);
                return response;
            }
            let refreshResponse: Response;
            try {
                refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                    cache: "no-store",
                });
            } catch {
                return portalLogin(request, base, "connection");
            }
            if (!refreshResponse.ok) {
                const response = portalLogin(request, base, "session");
                response.cookies.delete(ACCESS_COOKIE);
                response.cookies.delete(REFRESH_COOKIE);
                return response;
            }
            rotatedTokens = await refreshResponse.json() as TokenResponse;
            accessToken = rotatedTokens.access_token;
            request.cookies.set(ACCESS_COOKIE, rotatedTokens.access_token);
            request.cookies.set(REFRESH_COOKIE, rotatedTokens.refresh_token);
            try {
                profileResponse = await currentProfile(accessToken);
            } catch {
                return portalLogin(request, base, "connection");
            }
            if (profileResponse.status !== 401 && !profileResponse.ok) {
                return portalLogin(request, base, "connection");
            }
        }

        if (!profileResponse?.ok) {
            const response = portalLogin(request, base, "session");
            response.cookies.delete(ACCESS_COOKIE);
            response.cookies.delete(REFRESH_COOKIE);
            return response;
        }
        const profile = await profileResponse.json() as UserProfile;
        if (profile.role !== ROLE_FOR_PORTAL[portal as keyof typeof ROLE_FOR_PORTAL]) {
            const url = request.nextUrl.clone();
            url.pathname = `/${PORTAL_FOR_ROLE[profile.role]}`;
            const response = NextResponse.redirect(url);
            if (rotatedTokens) setSessionCookies(response, rotatedTokens);
            return response;
        }
        if (profile.must_change_password && portalPath !== "/change-password") {
            const url = request.nextUrl.clone();
            url.pathname = `${base}/change-password`;
            const response = NextResponse.redirect(url);
            if (rotatedTokens) setSessionCookies(response, rotatedTokens);
            return response;
        }
        if (!profile.must_change_password && portalPath === "/change-password") {
            const url = request.nextUrl.clone();
            url.pathname = base;
            const response = NextResponse.redirect(url);
            if (rotatedTokens) setSessionCookies(response, rotatedTokens);
            return response;
        }
        if (rotatedTokens) {
            const response = nextPortal(request, base);
            setSessionCookies(response, rotatedTokens);
            return response;
        }
    }

    return nextPortal(request, base);
}

function nextPortal(request: NextRequest, base: string) {
    const headers = new Headers(request.headers);
    headers.set("x-portal-base", base);
    return NextResponse.next({ request: { headers } });
}

function setSessionCookies(response: NextResponse, tokens: TokenResponse) {
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
        httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: ACCESS_MAX_AGE,
    });
    response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
        httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: REFRESH_MAX_AGE,
    });
}

export const config = {
    matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
