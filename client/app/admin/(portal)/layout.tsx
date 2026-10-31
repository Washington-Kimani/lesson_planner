import { AppShell } from "@/app/components/AppShell";
import { apiGetOptional } from "@/lib/api";
import { getSessionProfile } from "@/lib/session";
import type { AdminStats } from "@/lib/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const profile = await getSessionProfile();
    const stats = await apiGetOptional<AdminStats>("/stats");
    return (
        <AppShell
            portal="admin"
            name={`${profile.first_name} ${profile.last_name}`}
            avatarUrl={profile.avatar_url}
            pendingRequests={stats?.pending_requests ?? 0}
        >
            {children}
        </AppShell>
    );
}
