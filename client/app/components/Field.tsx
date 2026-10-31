"use client";

import { InputHTMLAttributes, useId } from "react";

export function Field({ label, hint, full, ...input }: {
    label: string;
    hint?: string;
    full?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
    const id = useId();
    return (
        <div className={`field${full ? " full" : ""}`}>
            <label htmlFor={id}>{label}</label>
            <input id={id} className="input" {...input} />
            {hint && <small>{hint}</small>}
        </div>
    );
}
