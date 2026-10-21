import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost";

// subdomain -> folder under app/
const PORTALS: Record<string, string> = {
    admin: "/admin",
    teachers: "/teachers",
    students: "/students",
};

export function proxy(request: NextRequest) {
    const host = (request.headers.get("host") ?? "").split(":")[0];
    const { pathname } = request.nextUrl;

    const subdomain = host.endsWith(`.${ROOT_DOMAIN}`)
        ? host.slice(0, -(ROOT_DOMAIN.length + 1))
        : null;
    const base = subdomain ? PORTALS[subdomain] : undefined;

    if (!base) {
        // Bare domain or unknown subdomain: hide the portal folders so
        // localhost:3000/admin can't be used to bypass the subdomain split.
        const hitsPortalFolder = Object.values(PORTALS).some(
            (p) => pathname === p || pathname.startsWith(`${p}/`)
        );
        if (hitsPortalFolder) return new NextResponse(null, { status: 404 });
        return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? base : `${base}${pathname}`;
    return NextResponse.rewrite(url);
}

export const config = {
    // Skip API routes, Next internals and static files
    matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};