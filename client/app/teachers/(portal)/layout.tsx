import { AppShell } from "@/app/components/AppShell";

export default function TeachersLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppShell portal="teachers" name="Teacher">
            {children}
        </AppShell>
    );
}