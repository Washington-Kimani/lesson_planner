import type { Metadata } from "next";
import { PortalSignIn } from "@/app/components/PortalSignIn";

export const metadata: Metadata = { title: "Administrator sign in · Lesson Planner", description: "Sign in to manage classes, subjects and teaching assignments." };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams;
    return <PortalSignIn portal="admin" status={status} />;
}
