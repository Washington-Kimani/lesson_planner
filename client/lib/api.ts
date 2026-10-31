import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ACCESS_COOKIE, API_BASE_URL } from "@/lib/auth";

async function request(path: string) {
    const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (!accessToken) redirect("/login?status=session");
    return fetch(`${API_BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
    });
}

/** Server-side GET with the signed-in user's token. Redirects on 401, 404s on 404, throws otherwise. */
export async function apiGet<T>(path: string): Promise<T> {
    const response = await request(path);
    if (response.status === 401) redirect("/login?status=session");
    if (response.status === 404) notFound();
    if (!response.ok) throw new Error(`Request to ${path} failed (${response.status})`);
    return response.json() as Promise<T>;
}

/** Like apiGet, but returns null instead of failing the page. For nice-to-have data such as badge counts. */
export async function apiGetOptional<T>(path: string): Promise<T | null> {
    try {
        const response = await request(path);
        return response.ok ? (await response.json() as T) : null;
    } catch (error) {
        // redirect() works by throwing; let those through
        if (error instanceof Error && "digest" in error) throw error;
        return null;
    }
}
