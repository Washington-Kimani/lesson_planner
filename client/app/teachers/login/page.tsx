import type { Metadata } from "next";
import { PortalSignIn } from "@/app/components/PortalSignIn";

export const metadata: Metadata = { title: "Teacher sign in · Lesson Planner", description: "Sign in to plan and manage your lessons." };

export default async function TeacherLogin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams;
    return <PortalSignIn portal="teachers" status={status} />;
}
