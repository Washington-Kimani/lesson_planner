import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarDays, Eye, MoonStar } from "lucide-react";
import { portalHref } from "@/lib/portal";

const portals = [
    {
        name: "Teachers",
        description: "Plan lessons for your classes, manage your students and keep your timetable organised.",
        href: portalHref("teachers"),
        label: "Teacher sign in",
        icon: BookOpenCheck,
    },
    {
        name: "Students",
        description: "See your lessons and what’s coming up in each class.",
        href: portalHref("students"),
        label: "Student sign in",
        icon: Eye,
    },
    {
        name: "Administrators",
        description: "Set up classes, subjects and teaching assignments for the whole school.",
        href: portalHref("admin"),
        label: "Administrator sign in",
        icon: CalendarDays,
    },
];

export default function Home() {
    return (
        <main className="public-page">
            <header className="public-header">
                <Link className="wordmark" href="/">
                    <span className="brand-mark">T</span>
                    Tutorium
                </Link>
                <nav aria-label="Main navigation" className="public-nav">
                    <Link href="/help">Help</Link>
                    <a className="button button-small button-primary" href={portalHref("teachers")}>Sign in</a>
                </nav>
            </header>

            <section className="hero">
                <div className="hero-copy">
                    <span className="eyebrow"><span className="eyebrow-dot" /> A calmer way to plan</span>
                    <h1>Lesson planning,<br /><em>all in one place.</em></h1>
                    <p>Tutorium gives your school’s teachers a simple way to plan lessons, and gives students a clear view of what’s coming up in class.</p>
                    <div className="hero-actions">
                        <a href={portalHref("teachers")} className="button button-primary">Sign in <ArrowRight size={16} /></a>
                        <Link href="/request-account" className="button button-light">Request a teacher account</Link>
                    </div>
                    <div className="hero-note"><span className="note-avatar">TU</span><span>For the whole school, from first bell to last.</span></div>
                </div>
                <div className="preview-card" aria-label="Tutorium calendar preview">
                    <div className="preview-top"><div><span className="preview-label">YOUR WEEK</span><h2>Weekly overview</h2></div><span className="preview-dots">•••</span></div>
                    <div className="preview-week">{["M", "T", "W", "T", "F"].map((day, index) => <div key={`${day}-${index}`} className={index === 2 ? "week-day selected-day" : "week-day"}><span>{day}</span><b>{[12, 13, 14, 15, 16][index]}</b></div>)}</div>
                    <div className="preview-lesson lesson-purple"><span className="lesson-time">09:00</span><span className="lesson-line" /><span><b>Fractions &amp; number patterns</b><small>Mathematics · Grade 7 East</small></span></div>
                    <div className="preview-lesson lesson-gold"><span className="lesson-time">10:30</span><span className="lesson-line" /><span><b>Descriptive writing</b><small>English · Grade 7 East</small></span></div>
                    <div className="preview-bottom"><span className="preview-avatar">AM</span><span><b>Wednesday, 14 October</b><small>2 lessons planned</small></span><span className="preview-check">✓</span></div>
                    <div className="preview-orbit orbit-one" /><div className="preview-orbit orbit-two" />
                </div>
            </section>

            <section className="portal-section">
                <div className="section-heading"><span className="eyebrow">CHOOSE YOUR PORTAL</span><h2>Everything your school needs,<br />in one welcoming place.</h2></div>
                <div className="portal-grid">{portals.map(({ name, description, href, label, icon: Icon }, index) => (
                    <article className={`portal-card portal-card-${index + 1}`} key={name}>
                        <div className="portal-icon"><Icon size={20} /></div><h3>{name}</h3><p>{description}</p>
                        <a href={href} className="text-link">{label}<ArrowRight size={15} /></a>
                    </article>
                ))}</div>
            </section>

            <section className="how-section">
                <div className="section-heading"><span className="eyebrow">SIMPLE BY DESIGN</span><h2>From your school to your screen.</h2></div>
                <div className="steps-grid">
                    <article><span className="step-number">01</span><h3>Your school sets you up.</h3><p>Teachers request an account and an administrator approves it. Teachers then create their students’ accounts.</p></article>
                    <article><span className="step-number">02</span><h3>Your details arrive by email.</h3><p>We email your login ID and a temporary password. For students, these go to a parent or guardian.</p></article>
                    <article><span className="step-number">03</span><h3>Choose your own password.</h3><p>Sign in with your details, set a new password the first time, and you’re ready to go.</p></article>
                </div>
            </section>

            <section className="features-section">
                <div className="features-copy"><span className="eyebrow">A LITTLE MORE CLARITY</span><h2>Make room for<br /><em>great teaching.</em></h2><p>Spend less time keeping track and more time making every lesson count.</p><Link className="text-link" href="/help">Explore the help centre <ArrowRight size={15} /></Link></div>
                <div className="feature-list">
                    <article><span className="feature-icon"><CalendarDays size={18} /></span><div><h3>Plan ahead</h3><p>Draft lessons with objectives, materials and homework. Publish when they’re ready.</p></div></article>
                    <article><span className="feature-icon"><CalendarDays size={18} /></span><div><h3>See the whole month</h3><p>Get every lesson at a glance, then select a day to explore its schedule.</p></div></article>
                    <article><span className="feature-icon"><Eye size={18} /></span><div><h3>Know what’s ready</h3><p>Students see lessons once their teacher has published them.</p></div></article>
                    <article><span className="feature-icon"><MoonStar size={18} /></span><div><h3>Work your way</h3><p>Switch between light and dark mode to suit your eyes.</p></div></article>
                </div>
            </section>

            <section className="closing-strip"><div><span className="eyebrow">HERE TO HELP</span><h2>Not sure where to start?</h2><p>Request a teacher account, read how accounts work, or contact your school administrator.</p></div><Link className="button button-light" href="/request-account">Request an account <ArrowRight size={16} /></Link></section>
            <footer className="public-footer"><Link className="wordmark" href="/"><span className="brand-mark">T</span>Tutorium</Link><nav aria-label="Footer navigation"><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link></nav><small>© {new Date().getFullYear()} Your School</small></footer>
        </main>
    );
}
