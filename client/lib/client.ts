export class ApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
    }
}

const CONNECTION = "We couldn’t reach the server. Check your connection and try again.";

function messageFrom(data: unknown): string {
    const detail = (data as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length) {
        // FastAPI validation errors: [{ loc: ["body", "email"], msg: "..." }]
        return detail.map((item: { loc?: (string | number)[]; msg?: string }) => {
            const field = String(item.loc?.at(-1) ?? "").replace(/_/g, " ");
            return field ? `${field.charAt(0).toUpperCase()}${field.slice(1)}: ${item.msg}` : String(item.msg);
        }).join(" ");
    }
    return "Something went wrong. Please try again.";
}

/** Browser-side call to the FastAPI service through /api/proxy, which attaches the session token. */
export async function api<T = unknown>(
    path: string,
    init: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown; form?: FormData } = {},
): Promise<T> {
    const hasBody = init.body !== undefined || init.form !== undefined;
    let response: Response;
    try {
        response = await fetch(`/api/proxy${path}`, {
            method: init.method ?? (hasBody ? "POST" : "GET"),
            headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
            body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
        });
    } catch {
        throw new ApiError(CONNECTION, 0);
    }
    if (response.status === 401) {
        // A full page load is intended here: it clears client state and lets the portal proxy decide where to send them
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login?status=session";
        throw new ApiError("Your session ended. Sign in again to continue.", 401);
    }
    const text = await response.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
    if (!response.ok) throw new ApiError(messageFrom(data), response.status);
    return data as T;
}
