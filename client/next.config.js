/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || 'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Proxy /api/* to the Express server. The browser only ever talks to the
  // Next.js origin, so the httpOnly auth cookie is same-origin (no CORS or
  // third-party-cookie headaches) and the API URL stays private.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
