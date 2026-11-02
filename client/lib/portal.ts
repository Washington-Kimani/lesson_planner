export type PortalRole = "admin" | "teachers" | "students";

export function portalPath(role: PortalRole, path = "") {
    const suffix = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
    return `/${role}${suffix}`;
}

export function portalHref(role: PortalRole, path = "/login") {
    return portalPath(role, path);
}

export function portalRoleFromPath(pathname: string): PortalRole | null {
    const role = pathname.split("/")[1];
    return role === "admin" || role === "teachers" || role === "students" ? role : null;
}

export function publicHref(path: string) {
    return path;
}
