export type PortalRole = "admin" | "teachers" | "students";

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost";
const protocol = rootDomain === "localhost" ? "http" : "https";
const port = rootDomain === "localhost" ? ":3000" : "";

export function portalHref(role: PortalRole, path = "/login") {
    return `${protocol}://${role}.${rootDomain}${port}${path}`;
}

export function publicHref(path: string) {
    return `${protocol}://${rootDomain}${port}${path}`;
}
