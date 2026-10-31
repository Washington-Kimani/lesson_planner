import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: [
        "admin.localhost",
        "teachers.localhost",
        "students.localhost",
    ],
};

export default nextConfig;
