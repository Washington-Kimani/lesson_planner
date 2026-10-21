"use client";

import { LogOut } from "lucide-react";
import { publicHref } from "@/lib/portal";

export function LogoutButton() {
    async function logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.assign(publicHref("/"));
    }

    return <button className="logout-button" onClick={logout} type="button"><LogOut size={16} /><span>Sign out</span></button>;
}
