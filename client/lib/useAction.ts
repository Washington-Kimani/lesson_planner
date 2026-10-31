"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Runs one async action at a time, tracks which one is busy, shows its error, then refreshes server data. */
export function useAction() {
    const router = useRouter();
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState("");

    async function run(key: string, action: () => Promise<unknown>, onDone?: () => void) {
        setError("");
        setBusy(key);
        try {
            await action();
            onDone?.();
            router.refresh();
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
        } finally {
            setBusy(null);
        }
    }

    return { run, busy, error, setError };
}
