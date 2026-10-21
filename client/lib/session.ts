import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, API_BASE_URL, type UserProfile } from "@/lib/auth";

export async function getSessionProfile(): Promise<UserProfile> {
    const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (!accessToken) redirect("/login?status=session");

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
    });
    if (!response.ok) throw new Error(`Could not load the signed-in profile (${response.status})`);
    return response.json() as Promise<UserProfile>;
}
