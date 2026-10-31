import Link from "next/link";

import { RequestsManager } from "@/app/components/RequestsManager";
import { apiGet } from "@/lib/api";
import type { AccountRequest, RequestStatus } from "@/lib/types";

export const metadata = { title: "Account requests · Tutorium" };

const TABS: { status: RequestStatus; label: string }[] = [
    { status: "pending", label: "Pending" },
    { status: "approved", label: "Approved" },
    { status: "rejected", label: "Declined" },
];

export default async function Requests({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams;
    const current = TABS.find((tab) => tab.status === status)?.status ?? "pending";
    const requests = await apiGet<AccountRequest[]>(`/account-requests?status=${current}`);

    return (
        <div>
            <div className="page-head">
                <div><span className="eyebrow">TEACHER ACCOUNTS</span><h2>Account requests</h2><p>Teachers ask for an account from the public request form. Approve to create it.</p></div>
                <nav className="tabs" aria-label="Request status">
                    {TABS.map((tab) => <Link key={tab.status} href={`/requests?status=${tab.status}`} className="tab" aria-current={tab.status === current ? "page" : undefined}>{tab.label}</Link>)}
                </nav>
            </div>
            <RequestsManager requests={requests} />
        </div>
    );
}
