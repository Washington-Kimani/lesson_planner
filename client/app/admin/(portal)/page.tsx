import { BookOpen, ClipboardList, UsersRound } from "lucide-react";

export const metadata = {
    title: "Administrator overview · Lesson Planner",
    description: "Manage school classes, subjects and teaching assignments.",
};

const areas = [
    { title: "Classes", text: "Create and manage your school’s classes and academic years.", icon: UsersRound },
    { title: "Subjects", text: "Set up the subjects that teachers can plan lessons for.", icon: BookOpen },
    { title: "Teaching assignments", text: "Connect teachers and subjects to the right classes.", icon: ClipboardList },
];

export default function AdminHome() {
    return <div className="role-dashboard">
        <div className="dashboard-heading"><div><span className="eyebrow">SCHOOL SETUP</span><h2>Administrator overview</h2><p>Set up the building blocks for teaching and learning.</p></div></div>
        <section className="admin-welcome glass"><div><span className="eyebrow">YOUR SCHOOL, WELL ORGANISED</span><h3>Everything starts with a good plan.</h3><p>Manage classes, subjects and teaching assignments from one place.</p></div><div className="admin-orbit"><span>LP</span></div></section>
        <section className="admin-area-grid" aria-label="Administration areas">{areas.map(({ title, text, icon: Icon }) => <article className="admin-area glass" key={title}><span className="feature-icon"><Icon size={19} /></span><h3>{title}</h3><p>{text}</p><span className="admin-coming-soon">Management tools coming soon</span></article>)}</section>
        <p className="dashboard-note">Account creation is managed by the school. Teachers can create student accounts from their teacher portal.</p>
    </div>;
}
