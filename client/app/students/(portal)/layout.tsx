import { AppShell } from "@/app/components/AppShell";
import { getSessionProfile } from "@/lib/session";

export default async function StudentsLayout({ children }: { children: React.ReactNode }) {
    const profile = await getSessionProfile();
    return (
        <AppShell portal="students" name={`${profile.first_name} ${profile.last_name}`} avatarUrl={profile.avatar_url}>
            {children}
        </AppShell>
    );
}
