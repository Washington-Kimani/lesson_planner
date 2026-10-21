import type { Metadata } from "next";
import { PortalSignIn } from "@/app/components/PortalSignIn";

export const metadata: Metadata = { title: "Student sign in · Lesson Planner", description: "Sign in to see your lessons and upcoming classes." };

export default async function StudentLogin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams;
    return <PortalSignIn portal="students" status={status} />;
}
