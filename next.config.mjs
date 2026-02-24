/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV !== "production";

const nextConfig = {
    poweredByHeader: false,
    distDir: isDevelopment ? ".next-dev" : ".next",
};

export default nextConfig;
