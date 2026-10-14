import Image from "next/image";

// components
import {NavBar} from "@/app/components/NavBar";

export default function Home() {
    return (
        <main className="grid min-h-screen place-items-center p-6">
            <div className="glass rounded-3xl p-8 text-center">
                <h1 className="mb-3 text-xl font-semibold">Lesson Planner</h1>
                <p className="text-sm text-muted">
                    Open admin.localhost:3000, teachers.localhost:3000 or students.localhost:3000
                </p>
            </div>
        </main>
    );
}
