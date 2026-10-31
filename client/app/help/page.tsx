import type { Metadata } from "next";
import { InfoPage } from "@/app/components/InfoPage";

export const metadata: Metadata = {
    title: "Help · Tutorium",
    description: "Answers about login IDs, passwords and your account.",
};

const questions = [
    ["How do I get a teacher account?", <>Fill in the <a href="/request-account">teacher account request form</a>. A school administrator reviews it, and once it’s approved your login ID and a temporary password are emailed to you.</>],
    ["What is a login ID?", <>It’s a code like <code>TCH-AB12-CD34</code> (teachers), <code>STU-AB12-CD34</code> (students) or <code>ADM-AB12-CD34</code> (administrators). You use it to sign in instead of an email address. Include the dashes. Capital letters aren’t required.</>],
    ["Where do I find my login ID?", <>In the email your school sent when your account was created. Search your inbox for “Your lesson planner account”.</>],
    ["My temporary password doesn’t work.", <>Type it carefully or copy and paste it, without any extra spaces. Temporary passwords never contain the letters I or O, or the numbers 0 or 1, so those characters can’t be mixed up. If it still fails, ask your administrator or teacher for help.</>],
    ["Why do I have to change my password?", <>The temporary password was sent by email, so it may have been seen by others. Choosing your own means only you know it.</>],
    ["I forgot my password.", <>Ask your school administrator to reset it for you. Students should ask their teacher.</>],
    ["How do I change my name or profile picture?", <>After you sign in, open your profile. You can update your name and add, replace or remove a picture.</>],
    ["Why can’t I see a lesson?", <>Students only see lessons that their teacher has published, for classes they’re enrolled in. If something seems to be missing, ask your teacher.</>],
    ["Which browsers work best?", <>Any recent version of Chrome, Edge, Firefox or Safari.</>],
    ["Is my information safe?", <>We limit what each person can see based on their role, and we store passwords in scrambled form. Read our <a href="/privacy">Privacy page</a> for details.</>],
    ["Who do I contact?", <>See the <a href="/contact">Contact page</a>.</>],
];

export default function HelpPage() {
    return <InfoPage title="Help and frequently asked questions" intro="Quick answers for signing in, finding your lessons and getting help with your account.">
        <div className="faq-list">{questions.map(([question, answer]) => <section className="faq-item" key={question as string}><h2>{question}</h2><p>{answer}</p></section>)}</div>
    </InfoPage>;
}
