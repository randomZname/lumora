/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint config migration to v9 flat config is tracked in docs/ISSUES.md.
  // Don't block production builds on it (tsc still runs and must pass).
  eslint: { ignoreDuringBuilds: true },
  // Keep ffmpeg-static out of the server bundle so its binary path resolves
  // correctly at runtime (otherwise Next rewrites the path -> ENOENT).
  experimental: {
    serverComponentsExternalPackages: ['ffmpeg-static'],
  },
};

module.exports = nextConfig;
