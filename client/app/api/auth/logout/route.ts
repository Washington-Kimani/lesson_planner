import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, API_BASE_URL, REFRESH_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    let revoked = true;
    if (refreshToken) {
        try {
            const result = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken }),
                cache: "no-store",
            });
            if (!result.ok) {
                revoked = false;
                console.error("Backend logout failed", result.status);
            }
        } catch (error) {
            revoked = false;
            console.error("Backend logout could not be reached", error);
        }
    }
    const response = NextResponse.json(
        { ok: revoked },
        { status: revoked ? 200 : 502 }
    );
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
}
