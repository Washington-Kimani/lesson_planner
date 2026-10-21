import { NextRequest, NextResponse } from "next/server";
import {
    ACCESS_COOKIE, ACCESS_MAX_AGE, API_BASE_URL, REFRESH_COOKIE, REFRESH_MAX_AGE,
    type TokenResponse, type UserProfile,
} from "@/lib/auth";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost";
const PORTALS: Record<string, string> = {
    admin: "/admin",
    teachers: "/teachers",
    students: "/students",
};
const ROLE_FOR_SUBDOMAIN = { admin: "admin", teachers: "teacher", students: "student" } as const;

async function currentProfile(accessToken: string) {
    return fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
    });
}

function portalLogin(request: NextRequest, status: "session" | "connection") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?status=${status}`;
    return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
    const host = (request.headers.get("host") ?? "").split(":")[0];
    const { pathname } = request.nextUrl;
    const subdomain = host.endsWith(`.${ROOT_DOMAIN}`)
        ? host.slice(0, -(ROOT_DOMAIN.length + 1))
        : null;
    const base = subdomain ? PORTALS[subdomain] : undefined;

    if (!base || !(subdomain && subdomain in ROLE_FOR_SUBDOMAIN)) {
        const hitsPortalFolder = Object.values(PORTALS).some(
            (portal) => pathname === portal || pathname.startsWith(`${portal}/`)
        );
        if (hitsPortalFolder) return new NextResponse(null, { status: 404 });
        return NextResponse.next();
    }

    const loginPage = pathname === "/login";
    if (!loginPage) {
        let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
        const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
        let profileResponse: Response | null = null;
        let rotatedTokens: TokenResponse | null = null;

        if (accessToken) {
            try {
                profileResponse = await currentProfile(accessToken);
            } catch {
                return portalLogin(request, "connection");
            }
            if (profileResponse.status !== 401 && !profileResponse.ok) {
                return portalLogin(request, "connection");
            }
        }

        if (!profileResponse || profileResponse.status === 401) {
            if (!refreshToken) {
                const response = portalLogin(request, "session");
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
                return portalLogin(request, "connection");
            }
            if (!refreshResponse.ok) {
                const response = portalLogin(request, "session");
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
                return portalLogin(request, "connection");
            }
            if (profileResponse.status !== 401 && !profileResponse.ok) {
                return portalLogin(request, "connection");
            }
        }

        if (!profileResponse?.ok) {
            const response = portalLogin(request, "session");
            response.cookies.delete(ACCESS_COOKIE);
            response.cookies.delete(REFRESH_COOKIE);
            return response;
        }
        const profile = await profileResponse.json() as UserProfile;
        if (profile.role !== ROLE_FOR_SUBDOMAIN[subdomain as keyof typeof ROLE_FOR_SUBDOMAIN]) {
            const url = request.nextUrl.clone();
            url.hostname = `${profile.role === "teacher" ? "teachers" : profile.role === "student" ? "students" : "admin"}.${ROOT_DOMAIN}`;
            url.pathname = "/";
            const response = NextResponse.redirect(url);
            if (rotatedTokens) setSessionCookies(response, rotatedTokens);
            return response;
        }
        if (profile.must_change_password && pathname !== "/change-password") {
            const url = request.nextUrl.clone();
            url.pathname = "/change-password";
            const response = NextResponse.redirect(url);
            if (rotatedTokens) setSessionCookies(response, rotatedTokens);
            return response;
        }
        if (!profile.must_change_password && pathname === "/change-password") {
            const url = request.nextUrl.clone();
            url.pathname = "/";
            const response = NextResponse.redirect(url);
            if (rotatedTokens) setSessionCookies(response, rotatedTokens);
            return response;
        }
        if (rotatedTokens) {
            const response = rewritePortal(request, base);
            setSessionCookies(response, rotatedTokens);
            return response;
        }
    }

    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? base : `${base}${pathname}`;
    return NextResponse.rewrite(url);
}

function rewritePortal(request: NextRequest, base: string) {
    const url = request.nextUrl.clone();
    const pathname = request.nextUrl.pathname;
    url.pathname = pathname === "/" ? base : `${base}${pathname}`;
    return NextResponse.rewrite(url, { request: { headers: request.headers } });
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
