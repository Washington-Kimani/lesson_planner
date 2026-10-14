import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    allowedDevOrigins: [
        "admin.localhost",
        "teachers.localhost",
        "students.localhost",
    ]
};

export default nextConfig;
