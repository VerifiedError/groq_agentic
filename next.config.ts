import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Enable standalone output for Docker

  // Disable ESLint and TypeScript checks during production builds
  // This allows Docker builds to complete even with linting warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Fix for Windows EISDIR error with catch-all routes
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.symlinks = false
    }
    // Disable webpack caching to avoid EISDIR errors on Windows
    config.cache = false
    return config
  },
};

export default nextConfig;
