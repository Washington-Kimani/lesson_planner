"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();

    return (
        <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="grid size-10 place-items-center rounded-full border border-line bg-cell text-fg transition hover:bg-accent-soft"
        >
            {/* CSS picks the icon, so there's no hydration mismatch */}
            <Sun className="hidden size-4 dark:block" />
            <Moon className="size-4 dark:hidden" />
        </button>
    );
}