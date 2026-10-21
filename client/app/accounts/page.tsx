import type { Metadata } from "next";
import { InfoPage } from "@/app/components/InfoPage";
import { portalHref } from "@/lib/portal";

export const metadata: Metadata = {
    title: "How to get an account · Lesson Planner",
    description: "Accounts are created by your school. Find out how to get yours.",
};

export default function AccountsPage() {
    return <InfoPage title="How to get an account" intro="Lesson Planner doesn’t have a public sign-up. Your school creates your account for you, so only the right people can get in.">
        <h2>Who sets up your account</h2>
        <ul>
            <li><strong>Teachers:</strong> An administrator creates your account. You’ll receive an email with your login ID and a temporary password.</li>
            <li><strong>Students:</strong> Your teacher creates your account. Your login details are emailed to your parent or guardian, so ask them to share it with you.</li>
            <li><strong>Administrators:</strong> Administrator accounts are set up by the person who runs this system.</li>
        </ul>
        <h2>When you have your details</h2>
        <ol>
            <li>Open your portal sign-in page: <a href={portalHref("teachers")}>Teacher</a>, <a href={portalHref("students")}>Student</a> or <a href={portalHref("admin")}>Administrator</a>.</li>
            <li>Enter your login ID and the temporary password exactly as written in the email.</li>
            <li>Choose a new password of at least 10 characters.</li>
            <li>That’s it. You’re signed in.</li>
        </ol>
        <h2>Haven’t received an email?</h2>
        <ul>
            <li>Check your spam or junk folder. The subject line is “Your lesson planner account”.</li>
            <li>Ask your administrator (or your teacher, if you’re a student) to check the email address they have for you.</li>
            <li>Still stuck? <a href="/contact">Contact your school</a>.</li>
        </ul>
    </InfoPage>;
}
