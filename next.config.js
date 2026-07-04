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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            // 'unsafe-inline'/'unsafe-eval' required by Next.js runtime + styled JSX.
            // media-src/img-src allow provider CDNs (fal.media) and data/blob previews.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' data: blob: https:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
