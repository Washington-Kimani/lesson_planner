import type { Metadata } from "next";
import { InfoPage } from "@/app/components/InfoPage";

export const metadata: Metadata = {
    title: "Privacy · Tutorium",
    description: "What information Tutorium holds and who can see it.",
};

export default function PrivacyPage() {
    return <InfoPage title="Privacy" intro="This page explains what information Tutorium holds, why, and who can see it. We’ve kept it in plain language.">
        <div className="privacy-callout"><strong>Draft for review.</strong> This page is a draft. Please have it reviewed before publishing. The app holds children’s information, and the school may have legal obligations under data protection law (for example, Kenya’s Data Protection Act, if it applies to you).</div>
        <h2>What we hold</h2>
        <ul>
            <li><strong>Everyone:</strong> your name, login ID, role, and your sign-in details. Passwords are stored in scrambled form, so nobody can read them.</li>
            <li><strong>Teachers:</strong> your email address, employee number, department, qualification and phone number. If you use the account request form, we also keep the details and message you submit until an administrator has reviewed them.</li>
            <li><strong>Students:</strong> your admission number, date of birth, and your parent or guardian’s name, email and phone number. We may also hold a student email address if one was provided.</li>
            <li><strong>Profile pictures:</strong> optional, and you can remove yours at any time.</li>
            <li><strong>School activity:</strong> classes, subjects, enrolments and lessons created by teachers and administrators.</li>
            <li><strong>Sign-in activity:</strong> the time of your last sign-in.</li>
        </ul>
        <h2>Why we hold it</h2><p>To let you sign in, to show you the right lessons and classes, and to send account emails such as your login details. We don’t use this information for advertising [confirm].</p>
        <h2>Who can see it</h2>
        <ul><li>Students see their own details and the published lessons of their classes.</li><li>Teachers see the classes they teach, their students and their own lessons.</li><li>Administrators manage accounts, classes and assignments.</li><li>Profile pictures are only shown to people who are allowed to see them.</li></ul>
        <h2>Services that help us run Tutorium</h2><p>We use other companies to store or process data for us: [email provider] to send emails, Cloudinary to store profile pictures, and [Neon / hosting provider] to host our database and servers. [Confirm the full list and where data is stored.]</p>
        <h2>Students and families</h2><p>Student accounts are created by teachers, and login details are sent to a parent or guardian. Parents and guardians can ask Your School to correct or remove their child’s information by contacting [support email].</p>
        <h2>How long we keep it</h2><p>[State your retention period, for example: account information is kept while a person is at the school and for [period] afterwards.]</p>
        <h2>Your choices</h2><p>You can ask Your School to show you the information held about you, correct it, or remove it. Contact [support email].</p>
        <p className="last-updated">Last updated: [date]</p>
    </InfoPage>;
}
