import type { Metadata } from "next";
import { InfoPage } from "@/app/components/InfoPage";

export const metadata: Metadata = {
    title: "Contact · Lesson Planner",
    description: "Get help with signing in or your account.",
};

export default function ContactPage() {
    return <InfoPage title="Need help?" intro="For help with signing in or with your account, contact Your School’s administrator at [support email]. Please include your name and your role (teacher, student or administrator).">
        <div className="privacy-callout"><strong>Please don’t send your password.</strong><br />We will never ask for it.</div>
        <h2>Still need a hand?</h2>
        <p>Students can also ask their teacher for help with their account. If you’re unable to reach the administrator, ask the school office to pass on your message.</p>
        <p><strong>Phone:</strong> [Phone number]<br /><strong>Office hours:</strong> [Office hours]</p>
    </InfoPage>;
}
