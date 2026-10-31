import Image from "next/image";
import { subjectColor } from "@/lib/dates";

export function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
    return (
        <span
            className="avatar"
            style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)), background: subjectColor(name) }}
            aria-hidden="true"
        >
            {src ? <Image src={src} alt="" width={size} height={size} unoptimized /> : initials}
        </span>
    );
}
