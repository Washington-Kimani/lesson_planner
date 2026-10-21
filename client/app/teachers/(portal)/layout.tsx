import { AppShell } from "@/app/components/AppShell";
import { getSessionProfile } from "@/lib/session";

export default async function TeachersLayout({ children }: { children: React.ReactNode }) {
    const profile = await getSessionProfile();
    return (
        <AppShell portal="teachers" name={`${profile.first_name} ${profile.last_name}`}>
            {children}
        </AppShell>
    );
}