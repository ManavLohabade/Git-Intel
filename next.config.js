/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ["@prisma/client"]
    },
    serverlessFunction: {
        maxDuration: 60
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        domains: [
            "avatars.githubusercontent.com",
            "images.unsplash.com"
        ]
    }
};

export default nextConfig;
