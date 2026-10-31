import type { Metadata } from "next";
import Link from "next/link";

import { AccountRequestForm } from "@/app/components/AccountRequestForm";

export const metadata: Metadata = {
    title: "Request a teacher account · Tutorium",
    description: "Teachers can ask a school administrator to create their Tutorium account.",
};

export default function RequestAccountPage() {
    return (
        <main className="auth-page">
            <header className="auth-header">
                <Link className="wordmark" href="/"><span className="brand-mark">T</span>Tutorium</Link>
                <Link href="/help">Help</Link>
            </header>
            <AccountRequestForm />
            <footer className="auth-footer"><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link><span>© {new Date().getFullYear()} Your School</span></footer>
        </main>
    );
}
