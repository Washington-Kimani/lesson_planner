import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function StatCard({ label, value, note, icon: Icon, href }: {
    label: string;
    value: string | number;
    note?: string;
    icon: LucideIcon;
    href?: string;
}) {
    const body = (
        <>
            <div className="stat-label"><span>{label}</span><Icon size={17} /></div>
            <div className="stat-value">{value}</div>
            {note && <div className="stat-note">{note}</div>}
        </>
    );
    return href
        ? <Link href={href} className="stat-card glass block no-underline transition hover:border-accent-line">{body}</Link>
        : <div className="stat-card glass">{body}</div>;
}
