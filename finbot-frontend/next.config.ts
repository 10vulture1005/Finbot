import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // /api/chat is handled by the Next.js route handler (app/api/chat/route.ts)
      // which explicitly forwards Authorization headers for portfolio context.
      // All other /api/* paths are proxied generically to the backend.
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/v1/:path*',
        // Next.js route handlers always take priority over rewrites,
        // so /api/chat will NOT match this rewrite.
      },
    ]
  },
};

export default nextConfig;
