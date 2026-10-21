import { AppShell } from "@/app/components/AppShell";
import { getSessionProfile } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const profile = await getSessionProfile();
    return <AppShell portal="admin" name={`${profile.first_name} ${profile.last_name}`}>{children}</AppShell>;
}
