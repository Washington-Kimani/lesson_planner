import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function InfoPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
    return (
        <main className="info-page">
            <header className="public-header">
                <Link className="wordmark" href="/"><span className="brand-mark">L</span>Lesson Planner</Link>
                <Link className="text-link" href="/help">Help <ArrowLeft className="rotate-180" size={14} /></Link>
            </header>
            <article className="info-content">
                <span className="eyebrow">LESSON PLANNER · YOUR SCHOOL</span>
                <h1>{title}</h1>
                <p className="info-intro">{intro}</p>
                <div className="info-body">{children}</div>
            </article>
            <footer className="public-footer"><Link href="/">Lesson Planner</Link><nav><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link></nav><small>© {new Date().getFullYear()} Your School</small></footer>
        </main>
    );
}
