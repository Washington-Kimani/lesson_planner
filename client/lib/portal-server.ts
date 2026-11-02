import { headers } from "next/headers";
import { redirect } from "next/navigation";

const PORTAL_BASES = new Set(["/admin", "/teachers", "/students"]);

export async function redirectToPortalLogin() {
    const base = (await headers()).get("x-portal-base");
    if (!base || !PORTAL_BASES.has(base)) {
        throw new Error("Portal routing context is missing.");
    }
    redirect(`${base}/login?status=session`);
}
