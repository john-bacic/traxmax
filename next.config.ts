import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Better Safari compatibility
  reactStrictMode: false,
  // Disable ESLint during builds temporarily
  eslint: {
    ignoreDuringBuilds: true
  },
  // Configure headers for Safari
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
